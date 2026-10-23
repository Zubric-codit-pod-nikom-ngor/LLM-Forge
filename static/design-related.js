Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};



const all_hover_glowing = document.querySelectorAll(".BorderHoverGlow")
document.body.addEventListener("mousemove", (ev) => {
    all_hover_glowing.forEach((item) => {
        let rect = item.parentNode.getBoundingClientRect();
        item.animate(
            [{
                transform: `translate(calc(${ev.clientX - rect.left - rect.width / 2}px - 50%), calc(${ev.clientY - rect.top - rect.height / 2}px - 50%))`
            }],
            {
                duration: 200,
                fill: "forwards"
            }
        )
    })
})



const D = 0.5;

var task_keys = {
    "always_true": true,
    "always_false": false,
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Particle {
    constructor(item, vector, lifetime, speed_loss, parent) {
        this.item = item;
        this.vector = vector;
        this.lifetime = lifetime;
        this.speed_loss = speed_loss;
        this.parent = parent;
    }
}

async function generateKey() {
    let curr_time = new Date().getTime()
    let key = curr_time.toString()
    task_keys[key] = true
    return key
}

async function deleteKey(key) {
    task_keys[key] = false
    delete task_keys[key]
}

function randomVector(speed) {
    return [
        Math.random() * speed * 2 - speed,
        Math.random() * speed * 2 - speed
    ];
}

function basedLog(x, base) {
    return Math.log(x) / Math.log(base);
}

function createParticle(id, lifetime, speed_loss) {
    let new_particle = document.createElement("div");
    new_particle.style.width = "4px";
    new_particle.style.height = "4px";
    new_particle.style.backgroundColor = "#ffffff";
    new_particle.style.position = "absolute";
    new_particle.style.top = "0px";
    new_particle.style.left = "0px";

    let container = document.getElementById(id);
    if (window.getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    container.appendChild(new_particle);

    let speed = basedLog(lifetime, speed_loss);
    let vector = randomVector(speed);
    return new Particle(new_particle, vector, lifetime, speed_loss, document.getElementById(id));
}

function stepParticle(item) {

    function degradeVector(vector, loss) {
        return [
            vector[0] * (2 - loss),
            vector[1] * (2 - loss)
        ];
    }

    let new_vector = degradeVector(item.vector, item.speed_loss);

    let current_left = parseFloat(item.item.style.left) || 0;
    let current_top = parseFloat(item.item.style.top) || 0;

    item.item.style.left = (current_left + new_vector[0]) + "px";
    item.item.style.top = (current_top + new_vector[1]) + "px";

    item.vector = new_vector;

    return item;
}

function getParticleAnimationDuration(particle) {
    let steps_left_x = Math.max(0, Math.ceil(basedLog(D / Math.abs(particle.vector[0]), 2 - particle.speed_loss)));
    let steps_left_y = Math.max(0, Math.ceil(basedLog(D / Math.abs(particle.vector[1]), 2 - particle.speed_loss)));
    return Math.max(steps_left_x, steps_left_y);
}

async function rawParticleAnimation(new_key, particle, timeSpent){
    while (((Math.abs(particle.vector[0]) > D) || (Math.abs(particle.vector[1]) > D)) && task_keys[new_key]) {
        await new Promise(r => setTimeout(r, timeSpent));
        particle = stepParticle(particle);
    }
}

async function animateParticle(new_key, particle, destroyAfterJob=true, timeSpent=10, animationTime=1500, animation="fade") {
    let animation_used = false;
    while (((Math.abs(particle.vector[0]) > D) || (Math.abs(particle.vector[1]) > D)) && task_keys[new_key]) {
        await new Promise(r => setTimeout(r, timeSpent));
        particle = stepParticle(particle);

        let steps_left = getParticleAnimationDuration(particle)
        let time_left = Math.floor(steps_left + 10) * timeSpent || 0
        if (time_left <= animationTime && !animation_used) {
            particle.item.style.animation = animation + " " + time_left/1000 + "s linear"
            animation_used = true;
        }
    }
    if (destroyAfterJob) {
        particle.item.remove()
    }
    return particle
}

function clumpParticles(amount, id, lifetime, speed_loss) {
    let particles = [];
    for (let i = 0; i < amount; i++) {
        particles.push(createParticle(id, lifetime, speed_loss));
    }
    return particles;
}

function animateParticleClump(new_key, clump, destroyAfterJob=true, timeSpent=10, animationTime=1500, animation="fade") {
    clump.forEach(item => animateParticle(new_key, item, destroyAfterJob, timeSpent, animationTime, animation));
}

async function persistentParticles(new_key, clump, time, timeSpent=10, animationTime=1500, animation="fade") {

    async function itemMonitor(item, time_=0, parent=null) {

        if (time_ < time && task_keys[new_key]) {
            await animateParticle(new_key, item, false, timeSpent, animationTime, animation);

            if (parent == null) {
                parent = item.item.parentNode
            }

            item.vector = randomVector(basedLog(item.lifetime, item.speed_loss))
            item.item.style.top = "0px"
            item.item.style.left = "0px"
            item.item.style.removeProperty("animation");

            time_ += getParticleAnimationDuration(item) * timeSpent;
            await itemMonitor(item, time_, parent)
            item.item.remove()
        } else {
            animateParticle(new_key, item, true, timeSpent, animationTime, animation);
            await deleteKey(new_key)
        }
        item.item.remove()
        return item
    }

    let timings = 0
    clump.forEach((item) => {
        timings+=getParticleAnimationDuration(item)*timeSpent;
    })
    let average_timing = timings / clump.length

    console.log(average_timing)

    let results = await Promise.allSettled(clump.map(item => itemMonitor(item)))
    clump = results.map(item => item["value"])
    clump.forEach((item) => {item.item.remove()})
    return clump
}

async function timelessPersistentParticles(new_key, clump, timeSpent=10, animationTime=1500, animation="fade") {

    async function itemMonitor(item) {
        if (task_keys[new_key]) {
            await animateParticle(new_key, item, false, timeSpent, animationTime, animation);

            if (!task_keys[new_key]) {
                item.item.style.animation = animation + " " + (animationTime-getParticleAnimationDuration(item)*timeSpent)/1000 + "s linear"
                await rawParticleAnimation("always_true", item, timeSpent)
                item.item.remove()
                return
            }

            item.vector = randomVector(basedLog(item.lifetime, item.speed_loss))
            item.item.style.top = "0px"
            item.item.style.left = "0px"
            item.item.style.removeProperty("animation");

            await itemMonitor(item)
        }
    }

    await Promise.allSettled(clump.map(item => itemMonitor(item)))
    clump.forEach(item => item.item.remove())
    // await animateParticleClump("always_true", clump, true, timeSpent, animationTime, animation)

    return clump
}

function sparkParticleStyle(particle) {
    let object = particle.item
    object.style.background = "linear-gradient("+Math.random()*360+"deg, #FF0000, #FF5D00)"
    object.style.borderRadius = "40%";
    particle.item = object
    return particle
}

function styleAll(clump, style) {
    let new_clumps = []
    clump.forEach((item) => {
        new_clumps.push(
            style(item)
        )
    })
    return new_clumps
}



var global_particle_animations = [false]
var global_particle_clumps = [[]]
var global_particle_task_keys = [null]
const panelLayoutStates = new WeakMap();

const RESIZE_BORDER = 7.5;
const MIN_SIZE = 60;
const DOCK_DISTANCE = 20;
const DOCK_SEARCH_DISTANCE = 20;
const DOCK_MARGIN = 7.5;
let IS_SUPPORTING_VIEWPORT_RESIZE = false;
window.IS_EDITING = false;
window.IS_SNAPPING = false;

const ANCHOR_MIN_SIZE = 60;
const ANCHOR_DOCK_MARGIN = 7.5;
const MAIN_CONTAINER = document.getElementById("viewport-resize-container")
const RESIZE_CURSORS = {
    n: "ns-resize",  s: "ns-resize",
    e: "ew-resize",  w: "ew-resize",
    ne: "nesw-resize", sw: "nesw-resize",
    nw: "nwse-resize", se: "nwse-resize",
};
const AXES = {
    x: { start: 'left', end: 'right',  size: 'initialWidth',  styleSize: 'width',  stylePos: 'left', containerSize: 'width'  },
    y: { start: 'top',  end: 'bottom', size: 'initialHeight', styleSize: 'height', stylePos: 'top',  containerSize: 'height' }
};

window.CUSTOM_CONTEXT_OPS = {}
window.CUSTOM_CONTEXT_PROPS = []


function rectify(item) {
    let rect = item.getBoundingClientRect();
    return [
        rect.left,
        rect.top,
        rect.left+rect.width,
        rect.top+rect.height,
    ]
}

let draggable = [...document.getElementsByClassName("DraggableDiv")]

function updateDraggable(item) {
    item.addEventListener("mousedown", function (event) {
        const isEditing = item.classList.contains("editing");
        const canDrag = isEditing || item.classList.contains("DraggableNormally");
        if (!canDrag) return;

        event.preventDefault();

        let dockingSamples = []

        const parent = item.parentNode;
        const parentRect = parent.getBoundingClientRect();

        const itemRect = item.getBoundingClientRect();

        const offsetX = event.clientX - itemRect.left;
        const offsetY = event.clientY - itemRect.top;
        const isDocking = item.classList.contains("Docking");
        const rectified = [...document.getElementsByClassName("Dockable")]
            .filter(d => d !== item)
            .map(rectify);
        let toDestroy = []
        let prevRects = []

        function onMouseMove(ev) {
            const left = ev.clientX - parentRect.left - offsetX;
            const top = ev.clientY - parentRect.top - offsetY;

            item.style.left = left + "px";
            item.style.top = top + "px";

            if (isDocking === true) {
                dockingSamples.length = 0;
                let all_diffs = []
                const currentRect = rectify(item)
                let marchingRects = []
                for (i = 0; i < rectified.length; i++) {
                    let tempRect = rectified[i]
                    let diffs = [
                        - currentRect[0] + tempRect[2],
                        - currentRect[1] + tempRect[3],
                        - currentRect[2] + tempRect[0],
                        - currentRect[3] + tempRect[1],
                        currentRect[0] - tempRect[0],
                        currentRect[1] - tempRect[1],
                        currentRect[2] - tempRect[2],
                        currentRect[3] - tempRect[3],
                    ];let corr=[tempRect[2]+DOCK_MARGIN,tempRect[3]+DOCK_MARGIN,
                        tempRect[0]-DOCK_MARGIN,tempRect[1]-DOCK_MARGIN,tempRect[0],tempRect[1],
                        tempRect[2],tempRect[3]];
                    if (diffs.map((d) => {
                        return Math.abs(d) <= DOCK_SEARCH_DISTANCE
                    }).includes(true)) {
                        for (let j = 0; j < diffs.length; j++) {
                            if (Math.abs(diffs[j]) <= DOCK_SEARCH_DISTANCE) {
                                marchingRects.push([corr[j], j])
                                all_diffs.push(diffs)
                            }
                        }
                    }
                }
                toDestroy.forEach((item) => {item.remove()})
                if (marchingRects.length > 0 && prevRects != marchingRects) {
                    for (let j = 0; j < marchingRects.length; j++) {
                        let newDiv = document.createElement("div");
                        if (marchingRects[j][1]%2==1) {
                            newDiv.classList.add("InfLineHorizontal")
                            newDiv.classList.add("VCenter")
                            newDiv.style.top = marchingRects[j][0]-parentRect.top + "px";
                        } else if (marchingRects[j][1]%2==0) {
                            newDiv.classList.add("InfLineVertical")
                            newDiv.classList.add("HCenter")
                            newDiv.style.left = marchingRects[j][0]-parentRect.left + "px";
                        }
                        parent.appendChild(newDiv)
                        toDestroy.push(newDiv)
                        for (let s = 0; s < all_diffs[j].length; s++) {
                            if (Math.abs(all_diffs[j][s]) <= DOCK_DISTANCE && !dockingSamples.includes(marchingRects[j])) {
                                dockingSamples.push(marchingRects[j])
                            }
                        }
                    }
                }
                prevRects = marchingRects
            }
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            toDestroy.forEach((item) => {item.remove()})
            const rect = item.getBoundingClientRect();
            if (dockingSamples.length > 0) {
                for (let j = 0; j < dockingSamples.length; j++) {
                    const sample = dockingSamples[j];
                    const idx = sample[1];
                    const linePos = sample[0];
                    if (idx % 2 === 1) {
                        const subtract = (idx % 4) >= 2 ? rect.height : 0;
                        item.style.top = (linePos - parentRect.top - subtract) + "px";
                    } else {
                        const subtract = (idx % 4) >= 2 ? rect.width : 0;
                        item.style.left = (linePos - parentRect.left - subtract) + "px";
                    }
                }
            }

            // === ДОБАВИТЬ ЭТО: Обновляем привязки после отпускания мыши ===
            updatePanelAnchors(item);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
}
window.updateDraggable = updateDraggable

if (draggable.length > 0) {
    draggable.forEach(updateDraggable);
}

const resizable = [...document.getElementsByClassName("ResizeableDiv")]

function getResizeDirection(rect, x, y) {
    let dir = "";
    if (y - rect.top < RESIZE_BORDER) dir += "n";
    else if (rect.bottom - y < RESIZE_BORDER) dir += "s";
    if (x - rect.left < RESIZE_BORDER) dir += "w";
    else if (rect.right - x < RESIZE_BORDER) dir += "e";
    return dir;
}

function updateResizeable(item) {
    item.addEventListener("mousemove", (ev) => {
        if (item._busy) return;
        const isEditing = item.classList.contains("editing");
        const canResize = isEditing || item.classList.contains("ResizeableNormally");
        const canDrag   = isEditing || item.classList.contains("DraggableNormally");
        if (!canResize && !canDrag) {
            item.style.cursor = "default";
            return;
        }
        const rect = item.getBoundingClientRect();
        let dir = getResizeDirection(rect, ev.clientX, ev.clientY);
        if (!canResize) dir = "";
        item.style.cursor = RESIZE_CURSORS[dir] || (canDrag ? "move" : "default");
    });
    item.addEventListener("mouseleave", () => {
        if (item._busy) return;
        const isEditing = item.classList.contains("editing");
        const canDrag = isEditing || item.classList.contains("DraggableNormally");
        item.style.cursor = canDrag ? "move" : "default";
    });

    item.addEventListener("mousedown", function (event) {
        const isEditing = item.classList.contains("editing");
        const canResize = isEditing || item.classList.contains("ResizeableNormally");
        const canDrag   = isEditing || item.classList.contains("DraggableNormally");

        if (!canResize && !canDrag) return;

        const parent = item.parentNode;
        const itemRect = item.getBoundingClientRect();
        let dir = getResizeDirection(itemRect, event.clientX, event.clientY);
        if (!canResize) dir = "";
        if (!dir && !canDrag) return;

        event.preventDefault();
        item._busy = true;

        if (dir) {
            // item.style.border = "0";
            let grad_rot
            let color = "#ff3c00"
            if (dir == "s") {item.style.borderBottom = "5px solid "+color; grad_rot = 90}
            if (dir == "w") {item.style.borderLeft = "5px solid "+color; grad_rot = 190}
            if (dir == "n") {item.style.borderTop = "5px solid "+color; grad_rot = -90}
            if (dir == "e") {item.style.borderRight = "5px solid "+color; grad_rot = 0}

            const startX = event.clientX;
            const startY = event.clientY;
            const startWidth  = itemRect.width;
            const startHeight = itemRect.height;
            const startLeft   = item.offsetLeft;
            const startTop    = item.offsetTop;

            if (!item.style.left) item.style.left = startLeft + "px";
            if (!item.style.top)  item.style.top  = startTop  + "px";

            const parentRect = parent.getBoundingClientRect();
            const isDocking = item.classList.contains("Docking");
            const rectified = [...document.getElementsByClassName("Dockable")]
                .filter(d => d !== item)
                .map(rectify);
            let toDestroy = [];

            function onMouseMove(ev) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                let newWidth  = startWidth;
                let newHeight = startHeight;
                let newLeft   = startLeft;
                let newTop    = startTop;

                if (dir.includes("e")) newWidth  = startWidth + dx;
                if (dir.includes("s")) newHeight = startHeight + dy;
                if (dir.includes("w")) {
                    newWidth = startWidth - dx;
                    newLeft  = startLeft + dx;
                }
                if (dir.includes("n")) {
                    newHeight = startHeight - dy;
                    newTop    = startTop + dy;
                }

                if (newWidth < MIN_SIZE) {
                    if (dir.includes("w")) newLeft -= (MIN_SIZE - newWidth);
                    newWidth = MIN_SIZE;
                }
                if (newHeight < MIN_SIZE) {
                    if (dir.includes("n")) newTop -= (MIN_SIZE - newHeight);
                    newHeight = MIN_SIZE;
                }

                if (isDocking) {
                    const prospectiveLeft   = parentRect.left + newLeft;
                    const prospectiveTop    = parentRect.top  + newTop;
                    const prospectiveRight  = prospectiveLeft + newWidth;
                    const prospectiveBottom = prospectiveTop  + newHeight;

                    const candidates = [];
                    for (let i = 0; i < rectified.length; i++) {
                        const t = rectified[i];
                        const tL = t[0], tT = t[1], tR = t[2], tB = t[3];

                        const tryCandidate = (edge, pos, idx) => {
                            let dist;
                            if (edge === "w") dist = Math.abs(prospectiveLeft - pos);
                            else if (edge === "e") dist = Math.abs(prospectiveRight - pos);
                            else if (edge === "n") dist = Math.abs(prospectiveTop - pos);
                            else dist = Math.abs(prospectiveBottom - pos);

                            let vl = prospectiveLeft, vt = prospectiveTop,
                                vr = prospectiveRight, vb = prospectiveBottom;
                            if (edge === "w") vl = pos;
                            else if (edge === "e") vr = pos;
                            else if (edge === "n") vt = pos;
                            else vb = pos;

                            if (vl < tR && vr > tL && vt < tB && vb > tT) return;


                            candidates.push({ edge, pos, idx, dist });
                        };

                        if (dir.includes("w")) {
                            tryCandidate("w", tR + DOCK_MARGIN, 0);
                            tryCandidate("w", tL, 4);
                        }
                        if (dir.includes("e")) {
                            tryCandidate("e", tL - DOCK_MARGIN, 2);
                            tryCandidate("e", tR, 6);
                        }
                        if (dir.includes("n")) {
                            tryCandidate("n", tB + DOCK_MARGIN, 1);
                            tryCandidate("n", tT, 5);
                        }
                        if (dir.includes("s")) {
                            tryCandidate("s", tT - DOCK_MARGIN, 3);
                            tryCandidate("s", tB, 7);
                        }
                        let opposites = {
                            0: 2, 2: 0, 1: 3, 3: 1,
                            4: 6, 6: 4, 5: 7, 7: 5
                        }
                        const EDGE_IDX = { w: 0, n: 1, e: 2, s: 3 };
                        const EDGE_IDX_INNER = { w: 4, n: 5, e: 6, s: 7 };

                        const currentEdges = [...dir];
                        const currentIdx = currentEdges.map(e => EDGE_IDX[e]);
                        const currentIdxInner = currentEdges.map(e => EDGE_IDX_INNER[e]);
                        for (let i = 0; i < candidates.length; i++) {
                            let c = candidates[i];
                            if (currentIdx.includes(opposites[c.idx]) || currentIdxInner.includes(opposites[c.idx])) {
                                candidates.splice(i, 1);
                                i -= 1;
                            }
                        }
                    }

                    toDestroy.forEach(el => el.remove());
                    toDestroy = [];
                    const seen = new Set();
                    for (const c of candidates) {
                        if (c.dist > DOCK_SEARCH_DISTANCE) continue;
                        const key = c.idx + ":" + c.pos.toFixed(2);
                        if (seen.has(key)) continue;
                        seen.add(key);

                        const line = document.createElement("div");
                        if (c.idx % 2 === 1) {
                            line.classList.add("InfLineHorizontal");
                            line.classList.add("VCenter");
                            line.style.top = (c.pos - parentRect.top) + "px";
                        } else {
                            line.classList.add("InfLineVertical");
                            line.classList.add("HCenter");
                            line.style.left = (c.pos - parentRect.left) + "px";
                        }
                        parent.appendChild(line);
                        toDestroy.push(line);
                    }

                    const edgeSnaps = {};
                    for (const c of candidates) {
                        if (c.dist > DOCK_DISTANCE) continue;
                        if (!edgeSnaps[c.edge] || c.dist < edgeSnaps[c.edge].dist) {
                            edgeSnaps[c.edge] = c;
                        }
                    }

                    if (edgeSnaps.w) {
                        const newLeftVp = edgeSnaps.w.pos - parentRect.left;
                        newWidth += (newLeft - newLeftVp);
                        newLeft = newLeftVp;
                    }
                    if (edgeSnaps.e) {
                        const newRightVp = edgeSnaps.e.pos - parentRect.left;
                        newWidth = newRightVp - newLeft;
                    }
                    if (edgeSnaps.n) {
                        const newTopVp = edgeSnaps.n.pos - parentRect.top;
                        newHeight += (newTop - newTopVp);
                        newTop = newTopVp;
                    }
                    if (edgeSnaps.s) {
                        const newBottomVp = edgeSnaps.s.pos - parentRect.top;
                        newHeight = newBottomVp - newTop;
                    }

                    if (newWidth < MIN_SIZE) {
                        if (edgeSnaps.w) newLeft -= (MIN_SIZE - newWidth);
                        newWidth = MIN_SIZE;
                    }
                    if (newHeight < MIN_SIZE) {
                        if (edgeSnaps.n) newTop -= (MIN_SIZE - newHeight);
                        newHeight = MIN_SIZE;
                    }
                }

                item.style.width  = newWidth  + "px";
                item.style.height = newHeight + "px";
                item.style.left   = newLeft   + "px";
                item.style.top    = newTop    + "px";
            }

            function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                toDestroy.forEach(el => el.remove());
                item._busy = false;
                item.style.cursor = "move";
                document.body.style.userSelect = "";
                item.style.removeProperty("border");
                updatePanelAnchors(item)
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            document.body.style.userSelect = "none";
            return;
        }

        const offsetX = event.clientX - itemRect.left;
        const offsetY = event.clientY - itemRect.top;

        function onMouseMove(ev) {
            const pRect = parent.getBoundingClientRect();
            item.style.left = (ev.clientX - pRect.left - offsetX) + "px";
            item.style.top  = (ev.clientY - pRect.top  - offsetY) + "px";
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            item._busy = false;
            document.body.style.userSelect = "";
            item.style.removeProperty("border");
            updatePanelAnchors(item)
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "transparent";
    });
}
window.updateResizeable = updateResizeable

if (resizable.length > 0) {
    resizable.forEach(updateResizeable);
}



const circle = document.getElementById("loading-big-circle");

function showCircle() {
    circle.classList.add('active');
    void circle.offsetHeight;
}

function hideCircle() {
    circle.classList.remove('active');
}

if (sessionStorage.getItem("loaderTransition") === "true") {
    circle.style.transition = "transform 0s"
    showCircle();
}

window.SmoothTransition = function(url) {
    circle.style.transition = "transform 0.75s ease-in-out";
    showCircle();
    sessionStorage.setItem("loaderTransition", "true");
    setTimeout(() => {window.location.href = url;}, 750);
};

window.addEventListener("load", () => {
    if (sessionStorage.getItem("loaderTransition") === "true") {
        void circle.offsetHeight;
        setTimeout(() => {
            circle.style.transition = "transform 0.75s ease-in-out";
            hideCircle();
            sessionStorage.removeItem("loaderTransition");
        }, 300)
    } else {hideCircle()}
});



const starting_button = document.getElementById("enter-button")

if (starting_button) {
    starting_button.addEventListener("mouseenter", e => (async () => {
        async function run_particles() {
            if (!global_particle_animations[0]) {
                global_particle_animations[0] = true

                global_particle_task_keys[0] = await generateKey()
                await timelessPersistentParticles(global_particle_task_keys[0],
                    styleAll(clumpParticles(15, "particle1", 1.17, 1.03), sparkParticleStyle),
                    10, 1500, "spark")
            }
        }

        run_particles()
    })())

    starting_button.addEventListener("mouseleave", e => {
        global_particle_animations[0] = false
        deleteKey(global_particle_task_keys[0])
    })
}



const extra_load_particles = document.getElementById("extra-load-particles");
const extra_load = document.getElementById("extra-load");
const blur_layer = document.getElementById("blur-layer");
let extra_load_key

async function start_extra_load() {
    let new_clump = clumpParticles(30, extra_load_particles.id, 1.27, 1.03)
    new_clump = styleAll(new_clump, sparkParticleStyle)
    extra_load_key = await generateKey()
    extra_load.style.top = "50%"
    blur_layer.style.backdropFilter = "blur(120px)"
    await sleep(500)
    extra_load.style.boxShadow = "#ff3c00 0 0 50px"
    await sleep(500)
    await timelessPersistentParticles(
        extra_load_key,
        new_clump,
        15,
        1500, "spark"
    )
}

async function end_extra_load() {
    await deleteKey(extra_load_key)
    extra_load_key = null
    extra_load.style.boxShadow = "#000000 0 0 20px"
    await sleep(500)
    extra_load.style.top = "-100%"
    blur_layer.style.removeProperty("backdrop-filter")
    await sleep(500)
}
window.end_extra_load = end_extra_load;



function switch_editing() {
    window.IS_EDITING = !window.IS_EDITING
    document.getElementById('util-edit').classList.toggle('active');
    let every_editing_el = document.getElementsByClassName("editing");
    let every_not_editing_el = document.getElementsByClassName("not-editing");
    let every_editable_el = [...every_editing_el, ...every_not_editing_el];
    every_editable_el.forEach(el => {
        if (el.classList.contains("editing")) {
            el.classList.remove("editing");
            el.classList.add("not-editing");

            el.classList.remove("FaintDivBorder");
            el.classList.add("RemNormalBorderPadding");
        } else {
            el.classList.remove("not-editing");
            el.classList.add("editing");

            el.classList.add("FaintDivBorder");
            el.classList.remove("RemNormalBorderPadding");
        }
    });
}

function switch_docking() {
    window.IS_SNAPPING = !window.IS_SNAPPING;
    document.getElementById('util-dock').classList.toggle('active');
    let every_docking_el = document.getElementsByClassName("Docking");
    let every_not_docking_el = document.getElementsByClassName("not-Docking");
    let every_dockable_el = document.getElementsByClassName("Dockable");
    let every_not_dockable_el = document.getElementsByClassName("not-Dockable");
    let every_el = new Set([...every_docking_el, ...every_not_docking_el, ...every_not_dockable_el, ...every_dockable_el]);
    every_el.forEach(el => {
        if (el.classList.contains("Docking")) {
            el.classList.remove("Docking");
            el.classList.add("not-Docking");
        } else if (el.classList.contains("not-Docking")) {
            el.classList.remove("not-Docking");
            el.classList.add("Docking");
        }

        if (el.classList.contains("Dockable")) {
            el.classList.remove("Dockable");
            el.classList.add("not-Dockable");
        } else if (el.classList.contains("not-Dockable")) {
            el.classList.add("Dockable");
            el.classList.remove("not-Dockable");
        }
    });
}

function switch_viewport_resize() {
    document.getElementById('util-resize').classList.toggle('active');
    IS_SUPPORTING_VIEWPORT_RESIZE = !IS_SUPPORTING_VIEWPORT_RESIZE
}



function getLayoutState(el) {
    if (!panelLayoutStates.has(el)) {
        panelLayoutStates.set(el, {
            initialWidth: el.offsetWidth,
            initialHeight: el.offsetHeight,
            anchors: {left: null, right: null, top: null, bottom: null},
            margins: {left: 0, right: 0, top: 0, bottom: 0}
        });
    }
    return panelLayoutStates.get(el);
}

function updatePanelAnchors(el) {
    if (!el || !MAIN_CONTAINER) return;
    const state = getLayoutState(el);
    const containerRect = MAIN_CONTAINER.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    state.initialWidth = rect.width;
    state.initialHeight = rect.height;
    state.anchors = {left: null, right: null, top: null, bottom: null};

    if (Math.abs(rect.left - containerRect.left) < ANCHOR_DOCK_MARGIN * 2) {
        state.anchors.left = 'viewport';
        state.margins.left = rect.left - containerRect.left;
    }
    if (Math.abs(containerRect.right - rect.right) < ANCHOR_DOCK_MARGIN * 2) {
        state.anchors.right = 'viewport';
        state.margins.right = containerRect.right - rect.right;
    }
    if (Math.abs(rect.top - containerRect.top) < ANCHOR_DOCK_MARGIN * 2) {
        state.anchors.top = 'viewport';
        state.margins.top = rect.top - containerRect.top;
    }
    if (Math.abs(containerRect.bottom - rect.bottom) < ANCHOR_DOCK_MARGIN * 2) {
        state.anchors.bottom = 'viewport';
        state.margins.bottom = containerRect.bottom - rect.bottom;
    }

    const otherPanels = [...document.getElementsByClassName('DraggableDiv')].filter(p => p !== el);
    otherPanels.forEach(other => {
        const otherRect = other.getBoundingClientRect();
        const overlapY = rect.bottom > otherRect.top + ANCHOR_DOCK_MARGIN && rect.top < otherRect.bottom - ANCHOR_DOCK_MARGIN;
        const overlapX = rect.right > otherRect.left + ANCHOR_DOCK_MARGIN && rect.left < otherRect.right - ANCHOR_DOCK_MARGIN;

        if (Math.abs(rect.right - otherRect.left) < ANCHOR_DOCK_MARGIN * 2 && overlapY) state.anchors.right = other;
        if (Math.abs(rect.left - otherRect.right) < ANCHOR_DOCK_MARGIN * 2 && overlapY) state.anchors.left = other;
        if (Math.abs(rect.bottom - otherRect.top) < ANCHOR_DOCK_MARGIN * 2 && overlapX) state.anchors.bottom = other;
        if (Math.abs(rect.top - otherRect.bottom) < ANCHOR_DOCK_MARGIN * 2 && overlapX) state.anchors.top = other;
    });
}

function collectClosedChain(el, axis) {
    const chain = [el];
    const seen = new Set([el]);

    let cur = el;
    while (true) {
        const a = getLayoutState(cur).anchors[axis.start];
        if (a === 'viewport') break;
        if (!a || seen.has(a)) return null;
        seen.add(a);
        chain.unshift(a);
        cur = a;
    }
    cur = el;
    while (true) {
        const a = getLayoutState(cur).anchors[axis.end];
        if (a === 'viewport') break;
        if (!a || seen.has(a)) return null;
        seen.add(a);
        chain.push(a);
        cur = a;
    }
    return chain;
}

function distributeChainSizes(chain, available, axis) {
    const sizes = new Map();
    let free = [];
    let remaining = available;

    chain.forEach(p => {
        if (p.classList.contains('no-redist')) {
            const fixedSize = getLayoutState(p)[axis.size];
            sizes.set(p, fixedSize);
            remaining -= fixedSize;
        } else {
            free.push(p);
        }
    });

    if (free.length === 0) return sizes;

    for (let guard = 0; guard <= free.length && free.length; guard++) {
        const total = free.reduce((s, p) => s + getLayoutState(p)[axis.size], 0);
        const scale = total > 0 ? remaining / total : 0;
        const clamped = free.filter(p => getLayoutState(p)[axis.size] * scale < ANCHOR_MIN_SIZE);

        if (clamped.length === 0) {
            free.forEach(p => sizes.set(p, getLayoutState(p)[axis.size] * scale));
            break;
        }
        clamped.forEach(p => {
            sizes.set(p, ANCHOR_MIN_SIZE);
            remaining -= ANCHOR_MIN_SIZE;
        });
        free = free.filter(p => !clamped.includes(p));
    }
    return sizes;
}

function resolveAxisChains(panels, containerRect, axis) {
    const chains = [];
    const chainKeys = new Set();
    const sizeFor = new Map();

    panels.forEach(el => {
        const chain = collectClosedChain(el, axis);
        if (!chain) return;
        const key = chain.map(p => panels.indexOf(p)).join('-');
        if (chainKeys.has(key)) return;
        chainKeys.add(key);
        chains.push(chain);

        const first = getLayoutState(chain[0]);
        const last = getLayoutState(chain[chain.length - 1]);
        const available = containerRect[axis.containerSize]
            - first.margins[axis.start]
            - last.margins[axis.end]
            - ANCHOR_DOCK_MARGIN * (chain.length - 1);

        distributeChainSizes(chain, available, axis).forEach((size, p) => {
            sizeFor.set(p, Math.min(sizeFor.get(p) ?? Infinity, size));
        });
    });

    chains.forEach(chain => {
        let pos = getLayoutState(chain[0]).margins[axis.start];
        chain.forEach(p => {
            const size = sizeFor.get(p);
            p.style[axis.stylePos] = pos + 'px';
            p.style[axis.styleSize] = size + 'px';
            pos += size + ANCHOR_DOCK_MARGIN;
        });
    });

    return new Set(sizeFor.keys());
}

function resolveLayout() {
    if (!MAIN_CONTAINER) return;

    const containerRect = MAIN_CONTAINER.getBoundingClientRect();
    const panels = [...document.getElementsByClassName('DraggableDiv')];

    const doneX = resolveAxisChains(panels, containerRect, AXES.x);
    const doneY = resolveAxisChains(panels, containerRect, AXES.y);

    let iterations = 3;
    while (iterations > 0) {
        panels.forEach(el => {
            const state = getLayoutState(el);
            const anchors = state.anchors;

            const isNoRedist = el.classList.contains('no-redist');

            if (!doneX.has(el)) {
                let newLeft = el.offsetLeft;
                const newWidth = isNoRedist ? state.initialWidth : Math.max(ANCHOR_MIN_SIZE, state.initialWidth);
                let leftPos = null, rightPos = null;

                if (anchors.left === 'viewport') leftPos = containerRect.left + state.margins.left;
                else if (anchors.left) leftPos = anchors.left.getBoundingClientRect().right + ANCHOR_DOCK_MARGIN;

                if (anchors.right === 'viewport') rightPos = containerRect.right - state.margins.right;
                else if (anchors.right) rightPos = anchors.right.getBoundingClientRect().left - ANCHOR_DOCK_MARGIN;

                if (leftPos !== null) newLeft = leftPos - containerRect.left;
                else if (rightPos !== null) newLeft = (rightPos - containerRect.left) - newWidth;
                else {
                    if (newLeft + newWidth > containerRect.width) newLeft = containerRect.width - newWidth;
                    if (newLeft < 0) newLeft = 0;
                }
                el.style.left = newLeft + 'px';
                el.style.width = newWidth + 'px';
            }

            if (!doneY.has(el)) {
                let newTop = el.offsetTop;
                const newHeight = isNoRedist ? state.initialHeight : Math.max(ANCHOR_MIN_SIZE, state.initialHeight);
                let topPos = null, bottomPos = null;

                if (anchors.top === 'viewport') topPos = containerRect.top + state.margins.top;
                else if (anchors.top) topPos = anchors.top.getBoundingClientRect().bottom + ANCHOR_DOCK_MARGIN;

                if (anchors.bottom === 'viewport') bottomPos = containerRect.bottom - state.margins.bottom;
                else if (anchors.bottom) bottomPos = anchors.bottom.getBoundingClientRect().top - ANCHOR_DOCK_MARGIN;

                if (topPos !== null) newTop = topPos - containerRect.top;
                else if (bottomPos !== null) newTop = (bottomPos - containerRect.top) - newHeight;
                else {
                    if (newTop + newHeight > containerRect.height) newTop = containerRect.height - newHeight;
                    if (newTop < 0) newTop = 0;
                }
                el.style.top = newTop + 'px';
                el.style.height = newHeight + 'px';
            }
        });
        iterations--;
    }
}

if (MAIN_CONTAINER) {
    [...document.getElementsByClassName('DraggableDiv')].forEach(el => {
        updatePanelAnchors(el);
    });

    new ResizeObserver(() => {
        if (!IS_SUPPORTING_VIEWPORT_RESIZE) return
        resolveLayout();
    }).observe(MAIN_CONTAINER);
}



function wrap_listed(element) {
    let outside_wrap = document.createElement("a")
    outside_wrap.href = "#";
    outside_wrap.style.padding = "0";
    outside_wrap.style.margin = "0";

    let arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("viewBox", "0 0 24 24");
    arrow.ariaHidden = "true";
    arrow.style.padding = "0";
    arrow.style.margin = "0";

    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M4 12h15m-6-6 6 6-6 6")

    arrow.appendChild(path);
    outside_wrap.appendChild(arrow);
    outside_wrap.appendChild(element)
    return outside_wrap
}

const context_menu = document.getElementById("context-menu");
addEventListener("contextmenu", async (e) => {
    e.preventDefault();
    let actual_target = e.target
    while (!actual_target.isEqualNode(MAIN_CONTAINER)) {
        let temp_actual_target = actual_target.parentNode
        if (!(temp_actual_target)) {actual_target = null; break}
        if (temp_actual_target.isEqualNode(MAIN_CONTAINER)) {
            break
        } else {actual_target = temp_actual_target}
    }
    if (actual_target === null) return
    if (
        actual_target.isEqualNode(MAIN_CONTAINER) ||
        ["context-menu","extra-load",
        "extra-load-particles",
        "loading-big-circle",
        "notification-container",
        "util-container",
        "extension-container"].includes(actual_target.id)
    ) return

    let generic_context_ops = {
        "GENERIC_CONTEXT_INSTRUCTIONS": [
            "General", ["Delete Item", async () => {console.log("Deleting "+actual_target);
                actual_target.remove(); removeEventListener("mousemove", listener)
                context_menu.style.height = "0"; context_menu.style.opacity = "0"
                await sleep(250)}]
        ],
        "GENERIC_CONTEXT_PROPERTY_CHANGE": ["Properties",
        [(actual_target.classList.contains("no-redist") ? "Add" : "Remove")+" Resize Distribution", () => {console.log("no-redist"+" TOGGLED"); actual_target.classList.toggle("no-redist"); UpdateOps()}]],
        ...window.CUSTOM_CONTEXT_OPS
    }

    let props = ["ResizeableNormally", "DraggableNormally", "Dockable", "Docking",
        ...window.CUSTOM_CONTEXT_PROPS]; props.forEach(name => {
        generic_context_ops["GENERIC_CONTEXT_PROPERTY_CHANGE"].push(
            [name+" "+(actual_target.classList.contains(name) ? "-" : "+"),
            () => {console.log(name+" TOGGLED"); actual_target.classList.toggle(name); UpdateOps()}]
        )
    })

    if (actual_target.classList.contains("NODELETE")) generic_context_ops["GENERIC_CONTEXT_INSTRUCTIONS"].splice(1,1)

    function UpdateOps() {
        context_menu.innerHTML = ""
        generic_context_ops = {
            "GENERIC_CONTEXT_INSTRUCTIONS": [
                "General", ["Delete Item", async () => {console.log("Deleting "+actual_target);
                actual_target.remove(); removeEventListener("mousemove", listener)
                context_menu.style.height = "0"; context_menu.style.opacity = "0"
                await sleep(250)}]
            ],
            "GENERIC_CONTEXT_PROPERTY_CHANGE": ["Properties",
            [(actual_target.classList.contains("no-redist") ? "Add" : "Remove")+" Resize Distribution", () => {console.log("no-redist"+" TOGGLED"); actual_target.classList.toggle("no-redist"); UpdateOps()}]],
            ...window.CUSTOM_CONTEXT_OPS
        }

        props = ["ResizeableNormally", "DraggableNormally", "Dockable", "Docking",
        ...window.CUSTOM_CONTEXT_PROPS]; props.forEach(name => {
            generic_context_ops["GENERIC_CONTEXT_PROPERTY_CHANGE"].push(
                [name+" "+(actual_target.classList.contains(name) ? "-" : "+"),
                () => {console.log(name+" TOGGLED"); actual_target.classList.toggle(name); UpdateOps()}]
            )
        })

        if (actual_target.classList.contains("NODELETE")) generic_context_ops["GENERIC_CONTEXT_INSTRUCTIONS"].splice(1,1)
        Object.keys(generic_context_ops).forEach((op) => {
            if (!actual_target.classList.contains(op)) return
            let header = document.createElement("p")
            header.textContent = generic_context_ops[op][0]
            header.classList.add("SenFont")
            header.classList.add("NoSelect")
            header.style.color = "#ff9900"
            header.style.fontSize = "16px"
            header.style.padding = "0";
            header.style.margin = "0";

            context_menu.appendChild(header)
            generic_context_ops[op].slice(1).forEach((item) => {
                let label = document.createElement("span")
                label.classList.add("GoogleCodeFont")
                label.classList.add("NoSelect")
                label.textContent = item[0]
                label.style.color = "#ffffff"
                label.style.padding = "0";
                label.style.margin = "0";

                let container = wrap_listed(label)
                container.onclick = item[1]
                container.style.marginRight = "24px"
                context_menu.appendChild(container)
            })
            if (generic_context_ops[op].slice(1).length === 0)
                context_menu.childNodes[context_menu.childNodes.length - 1].remove();
            else {
                let line = document.createElement("div")
                line.style.width = "90%"
                line.style.border = "rgb(80,80,80) solid 1px"
                line.style.marginTop = "1px"
                line.style.marginBottom = "1px"
                line.style.marginLeft = "5%"
                line.style.marginRight = "5%"

                context_menu.appendChild(line)
            }
        })
        context_menu.childNodes[context_menu.childNodes.length - 1].remove();
    }

    if (
        Object.keys(generic_context_ops).some((op) => {
            return actual_target.classList.contains(op)
        }) !== true
    ) return

    UpdateOps()

    let top = e.clientY+10+"px"
    let left = e.clientX+10+"px"

    context_menu.style.opacity = "1";
    context_menu.style.left = left
    context_menu.style.top = top
    await sleep(20)
    context_menu.style.height = context_menu.scrollHeight + "px"
    await sleep(250)

    let rect = [
        context_menu.getBoundingClientRect().x, context_menu.getBoundingClientRect().y,
        context_menu.getBoundingClientRect().x + context_menu.getBoundingClientRect().width,
        context_menu.getBoundingClientRect().y + context_menu.getBoundingClientRect().height
    ]

    let listener = async (em) => {
        if (
               (em.clientX+15 < rect[0]) || (em.clientX > rect[2]+5)
            || (em.clientY+15 < rect[1]) || (em.clientY > rect[3]+5)
        ) {
            removeEventListener("mousemove", listener)
            context_menu.style.height = "0"
            context_menu.style.opacity = "0"
            await sleep(250)
        }
    }

    addEventListener("mousemove", listener)
})