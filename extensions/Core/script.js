let LAST_QUICK_CALL_TIME = Date.now()
let QUICK_CALL_GAP = 150
let QUICK_CALL_GEN = 0

let StarCounter = 0

let SVGs = {
    "download": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABKElEQVR4nO2ZwUrEMBRFT/qVLmbmN9y+wY0LmZUDgv7JfJIr0f2TQIQSWnUWGdK8e+BBoGnJPQ2BJCCEEEIIIcStmYB9qdwOxwHwUllCOGwmILfDYRKABLgEIAEuAUiAERCTACTAJQAJcAlAAoyAWAQBD8AX8ASkKwTkvqfy7pEN8zkL+VJJWBOQSt+fZx9smNMsSC1hSUAd3svs2SwJeK4CvZVD0FpA7nuu+r6OcGCaViQcKwFDhueXqf2+0l5aL4YgLcyEpRrqz18rYejwf0kIEX5NQqjwcwl3pYZb8IZk6vw2t/n4Dp3f5jYfn3W+fW0+PpMAJMAlAAlwCUACjOACLsB9Z3W5pQDvvJoI2HcQ7L+1ayFgKh9+7Lx2nW7WhBBCCCEEPfEN3kFEPgT6QJMAAAAASUVORK5CYII=",
    "like": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABnUlEQVR4nO3ZMUvDQBiA4RecRAWHgiBuKg4OLt3durgWHN2dRbA6+g8KDo5dCqW4dFMnxbEgdBAHf4CVllpF0MGTQgpFLuldosl9R164qSTkoWm+NIG8PHHdASpYn8A1sInAlGb1gS08gCjgCZjDA4gCTvAE0gNm8QCigF08gdTwBPKIgGYMIO8IaMcAMkBAFwaQexxvCfgygJzjeIcGiNHaw/EeDBDfwDIOt234bbRxvJoh5PQ/D+LW8CAm12ibcYvAR4x92K5hcFXcCIO8xdzxuP0UEOrXjeeKDtJJCGmnDFFAQwdpJYSoDNarDlIVCOnpIAcCIQ0dpCwM0gfWdJCiMEiJkArCIHUiGgqCdKMgHUGQXhSkJQjSiIJUhUD6YVesJLMkC0iJKZWFQOrTIEUhkO40SMEXSJz/JU6eWnFmybi0EM/AKgaFzZKj4AVNJUPIlSkiapbMB58vZAipY1HYLKkEmOMMIS82ENtZkiZkYAMpOgxp2kBsZ0nShxc2d7vrWHZpuPObiW1Gv5+z4Dz+6yclzTiIvLw8D/sBLsSN+7T0tOMAAAAASUVORK5CYII=",
    "hashtag": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABI0lEQVR4nO3UoWrCURzF8bOyokEYPoFYJj7BME2fYJjEtChLYpIVMYlt2ExiG76AGsUHkNnEBxjCygwWtcoBixzPv/w+cOOXe265QAghhBAk0gBOF2dvauXyNGZjauVKNGZhauWqNObb1Mp90JgvUyvXpTFtUys3pDHvpvZm/3Sp+6QgkEn4EX8QeU74IWvVQ8oJP2SGO8vShb+mVq5IY1amVq5CY6amVq5OY0amVq5FY3qmVq5PY5qmVm5MY2qmVm5OY15NrdwPjSmYWrkdjXkytVKPAI4XQw4AHgztzfi/d58RRPi/d5+e6iH837tPU/UQ/u/dp4Y7+6QLO6ZWbkBjGqZWbkJj3kyt3JLGvJhauS2NyZlauT2NSZvaEEIIIeCKM3+VvnCG5ivwAAAAAElFTkSuQmCC",
    "document": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAtElEQVR4nO3WQQrCQBBE0TqFiPc/kiiepiQwCxFcRLpqkun60GQZHukhA6RzReE8AFxXgBDAC8DNCanOjqEY8vx4StdMDbkAuDu+DMUQuDA0QCwYmiByDI2QLRnGDZFhZkAkmFmQcozjz77nbrYEhBUvnB0DGQVSHAPpBmHx/CqQdqvlioF0g1B0uL8LpN1quWIg3SBc5YrCVSCuGMgokOIYyCiQ4hjIKJCjQniQ+btlIAnm3gBxwrjC8DB8AAAAAElFTkSuQmCC"
}


window.extendSnapshotStates(() => {
    return {
        "LAST_QUICK_CALL_TIME": LAST_QUICK_CALL_TIME,
        "QUICK_CALL_GAP": QUICK_CALL_GAP,
        "QUICK_CALL_GEN": QUICK_CALL_GEN,
        "StarCounter": StarCounter,
        "window.favorites": window.favorites,
    }
}, "core-main")
window.initializeStateManager("core-main")



async function quickSearch(extra_query) {
    const myGeneration = ++QUICK_CALL_GEN

    const container = document.getElementById("search-suggestions")
    let query = document.getElementById("model-search").value
    if (extra_query) query = extra_query;
    if (query === "") {
        container.innerHTML = ""
        return;
    }

    if (LAST_QUICK_CALL_TIME + QUICK_CALL_GAP > Date.now()) {
        LAST_QUICK_CALL_TIME = Date.now();
        return;
    }
    LAST_QUICK_CALL_TIME = Date.now();
    let results = await window.pythonPipelineAPI.interactWithPythonPipeline(
        {
            "object": "search",
            "args": [query, 20],
            "kwargs": {}
        }
    )

    if (myGeneration !== QUICK_CALL_GEN) return;

    container.innerHTML = ""
    for (let result of results) {
        if (!(result)) {
            continue
        }

        let newSpan = document.createElement("span");
        newSpan.style.padding = "0"
        newSpan.classList.add("SenFont")
        newSpan.style.color = "white"
        newSpan.style.fontSize = "14px"
        newSpan.textContent = result.id

        let newContainer = document.createElement("div")
        newContainer.classList.add("SearchTile")
        newContainer.style.width = "calc(100% - 20px)"
        newContainer.style.height = "fit-content"
        newContainer.style.padding = "10px"
        newContainer.style.margin = "10px"
        newContainer.style.marginBottom = "5px"
        newContainer.draggable = true
        newContainer.style.cursor = "grab"

        let group = document.createElement("div")
        group.classList.add("PosHorizontally")
        group.style.display = "flex"
        group.style.width = "100%"
        group.style.height = "fit-content"
        group.style.marginTop = "7px"

        let divline = document.createElement("div")
        divline.style.width = "0"
        divline.style.height = "20px"
        divline.style.margin = "3px"
        divline.style.flexGrow = "0"
        divline.style.flexShrink = "0"
        divline.style.border = "#6c6c6c solid 1px"
        divline.style.borderRadius = "1px"

        let likes_container = document.createElement("div")
        likes_container.style.flex = "1"
        likes_container.style.gap = "10px"
        likes_container.style.alignItems = "center"
        likes_container.style.display = "flex"
        likes_container.style.justifyContent = "center"
        likes_container.style.flexDirection = "row"
        let likes_img = document.createElement("img")
        likes_img.src = SVGs["like"]
        likes_img.classList.add("NoSelect")
        likes_img.style.width = "20px"
        likes_img.style.height = "20px"
        likes_img.style.filter = "invert(0.8)"
        let likes_text = document.createElement("p")
        likes_text.classList.add("SenFont")
        likes_text.classList.add("NoSelect")
        likes_text.style.color = "white"
        likes_text.style.fontSize = "14px"
        likes_text.style.whiteSpace = "nowrap"
        likes_text.style.margin = "3px"
        likes_text.textContent = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "parse_amount",
                "args": [result.likes],
                "kwargs": {}
            }
        )
        likes_container.appendChild(likes_img)
        likes_container.appendChild(likes_text)
        group.appendChild(likes_container)

        group.appendChild(divline.cloneNode(false))

        let downloads_container = document.createElement("div")
        downloads_container.style.flex = "1"
        downloads_container.style.gap = "10px"
        downloads_container.style.alignItems = "center"
        downloads_container.style.display = "flex"
        downloads_container.style.justifyContent = "center"
        downloads_container.style.flexDirection = "row"
        let downloads_img = document.createElement("img")
        downloads_img.src = SVGs["download"]
        downloads_img.classList.add("NoSelect")
        downloads_img.style.width = "20px"
        downloads_img.style.height = "20px"
        downloads_img.style.filter = "invert(0.8)"
        let downloads_text = document.createElement("p")
        downloads_text.classList.add("SenFont")
        downloads_text.classList.add("NoSelect")
        downloads_text.style.color = "white"
        downloads_text.style.fontSize = "14px"
        downloads_text.style.whiteSpace = "nowrap"
        downloads_text.style.margin = "3px"
        downloads_text.textContent = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "parse_amount",
                "args": [result.downloads],
                "kwargs": {}
            }
        )
        downloads_container.appendChild(downloads_img)
        downloads_container.appendChild(downloads_text)
        group.appendChild(downloads_container)

        group.appendChild(divline)

        let tags_container = document.createElement("div")
        tags_container.style.flex = "1"
        tags_container.style.gap = "5px"
        tags_container.style.alignItems = "center"
        tags_container.style.display = "flex"
        tags_container.style.justifyContent = "center"
        tags_container.style.flexDirection = "row"
        let tags_img = document.createElement("img")
        tags_img.src = SVGs["hashtag"]
        tags_img.classList.add("NoSelect")
        tags_img.style.width = "20px"
        tags_img.style.height = "20px"
        tags_img.style.filter = "invert(0.8)"
        let tags_text = document.createElement("p")
        tags_text.classList.add("SenFont")
        tags_text.classList.add("NoSelect")
        tags_text.style.color = "white"
        tags_text.style.fontSize = "14px"
        tags_text.style.whiteSpace = "nowrap"
        tags_text.style.margin = "3px"
        tags_text.textContent = result.tags.length
        tags_container.appendChild(tags_img)
        tags_container.appendChild(tags_text)
        group.appendChild(tags_container)

        newContainer.appendChild(newSpan)
        newContainer.appendChild(group)
        container.appendChild(newContainer)

        newContainer.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", result.id);
        });
    }
}

function setContrastingText(divElement) {
    const bg = window.getComputedStyle(divElement).backgroundColor;
    const rgb = bg.match(/\d+/g).map(Number);

    if (rgb && rgb.length >= 3) {
        const [r, g, b] = rgb;
        const brightness = (r * 299 + g * 587 + b * 114) / 1200;

        if (brightness > 128) {
            divElement.style.color = "#1a1a1a";
        } else {
            divElement.style.color = "white";
        }
    }

}

async function dragPull(item, node, starNode) {
    try {

        let modelData = Array.from(await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "search",
                "args": [item],
                "kwargs": {"limit": 1}
            }
        ))[0]

        let modelCard = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "get_model_card",
                "args": [item],
                "kwargs": {}
            }
        )

        let modelCardString = "";
        for (let char of modelCard) {
            modelCardString += String.fromCodePoint(char)
        }

        let modelSize = ""
        for (let char of await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "get_model_download_size",
                "args": [item], "kwargs": {},
            }
        )) {
            modelSize += String.fromCodePoint(char)
        }

        starNode.setAttribute("currentJob", modelData.id)
        starNode.classList.remove("active")
        if (window.favorites.includes(modelData.id)) {
            starNode.classList.add("active")
        }

        node.parentElement.style.flexGrow = "1"
        node.innerHTML = window.MD.parse(modelCardString)
        node.parentElement.style.height = node.scrollHeight + "px"

        node.parentElement.children[0].innerHTML = ""
        modelData.tags.forEach((item) => {
            let newHashtag = document.createElement("div")
            newHashtag.classList.add("HashtagCard")
            newHashtag.classList.add("SenFont")
            newHashtag.style.height = "30px"
            newHashtag.style.fontSize = "12px"
            newHashtag.style.whiteSpace = "nowrap"
            newHashtag.style.color = "white"
            newHashtag.style.lineHeight = "23px"

            newHashtag.style.textAlign = "center"
            newHashtag.textContent = "#" + item
            newHashtag.style.mixBlendMode = "difference"

            node.parentElement.children[0].appendChild(newHashtag)
        })

        Array.from(node.parentElement.children[0].children).forEach((item) => {
            if (item.classList.contains("HashtagCard")) {
                let cval = Math.round(Math.random() * 360 - 1)
                item.style.setProperty("--random-color", "hsl(" + cval + ", 65%, 60%)")
                item.style.setProperty("--random-color-1", "hsl(" + cval + ", 65%, 45%)")
                setContrastingText(item)
            }
        })

        let group = document.createElement("div")
        group.classList.add("PosHorizontally")
        group.style.display = "flex"
        group.style.width = "100%"
        group.style.height = "fit-content"
        group.style.marginTop = "7px"
        group.style.marginBottom = "10px"
        group.style.paddingLeft = "15px"
        group.style.paddingRight = "15px"
        group.draggable = false

        let divline = document.createElement("div")
        divline.style.width = "0"
        divline.style.height = "30px"
        divline.style.margin = "3px"
        divline.style.flexGrow = "0"
        divline.style.flexShrink = "0"
        divline.style.border = "#6c6c6c solid 1px"
        divline.style.borderRadius = "1px"

        let likes_container = document.createElement("div")
        likes_container.style.flex = "1"
        likes_container.style.gap = "10px"
        likes_container.style.alignItems = "center"
        likes_container.style.display = "flex"
        likes_container.style.justifyContent = "center"
        likes_container.style.flexDirection = "row"
        let likes_img = document.createElement("img")
        likes_img.src = SVGs["like"]
        likes_img.classList.add("NoSelect")
        likes_img.style.width = "25px"
        likes_img.style.height = "25px"
        likes_img.style.filter = "invert(0.8)"
        let likes_text = document.createElement("p")
        likes_text.classList.add("SenFont")
        likes_text.classList.add("NoSelect")
        likes_text.style.color = "white"
        likes_text.style.fontSize = "14px"
        likes_text.style.whiteSpace = "nowrap"
        likes_text.style.margin = "3px"
        likes_text.textContent = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "parse_amount",
                "args": [modelData.likes],
                "kwargs": {}
            }
        )
        likes_container.appendChild(likes_img)
        likes_container.appendChild(likes_text)
        group.appendChild(likes_container)

        group.appendChild(divline.cloneNode(false))

        let downloads_container = document.createElement("div")
        downloads_container.style.flex = "1"
        downloads_container.style.gap = "10px"
        downloads_container.style.alignItems = "center"
        downloads_container.style.display = "flex"
        downloads_container.style.justifyContent = "center"
        downloads_container.style.flexDirection = "row"
        let downloads_img = document.createElement("img")
        downloads_img.src = SVGs["download"]
        downloads_img.classList.add("NoSelect")
        downloads_img.style.width = "25px"
        downloads_img.style.height = "25px"
        downloads_img.style.filter = "invert(0.8)"
        let downloads_text = document.createElement("p")
        downloads_text.classList.add("SenFont")
        downloads_text.classList.add("NoSelect")
        downloads_text.style.color = "white"
        downloads_text.style.fontSize = "14px"
        downloads_text.style.whiteSpace = "nowrap"
        downloads_text.style.margin = "3px"
        downloads_text.textContent = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "parse_amount",
                "args": [modelData.downloads],
                "kwargs": {}
            }
        )
        downloads_container.appendChild(downloads_img)
        downloads_container.appendChild(downloads_text)
        group.appendChild(downloads_container)

        group.appendChild(divline)

        let size_container = document.createElement("div")
        size_container.style.flex = "1"
        size_container.style.gap = "5px"
        size_container.style.alignItems = "center"
        size_container.style.display = "flex"
        size_container.style.justifyContent = "center"
        size_container.style.flexDirection = "row"
        let size_img = document.createElement("img")
        size_img.src = SVGs["document"]
        size_img.classList.add("NoSelect")
        size_img.style.width = "25px"
        size_img.style.height = "25px"
        size_img.style.filter = "invert(1)"
        let size_text = document.createElement("p")
        size_text.classList.add("SenFont")
        size_text.classList.add("NoSelect")
        size_text.style.color = "white"
        size_text.style.fontSize = "14px"
        size_text.style.whiteSpace = "nowrap"
        size_text.style.margin = "3px"
        size_text.textContent = modelSize
        size_container.appendChild(size_img)
        size_container.appendChild(size_text)
        group.appendChild(size_container)

        node.parentElement.children[0].prepend(group)
        node.parentElement.children[2].children[0].textContent = modelData.id

    } catch (err) {

        console.log(err)
        window.notify("Oops! Something went wrong!")
        node.parentElement.parentElement.removeChild(node.parentElement)

    }
}

function areEqual(arr1, arr2) {
    let N = arr1.length;
    let M = arr2.length;

    if (N !== M)
        return false;

    let map
        = new Map();
    let count = 0;
    for (let i = 0; i < N; i++) {
        if (map.get(arr1[i]) == null)
            map.set(arr1[i], 1);
        else {
            count = map.get(arr1[i]);
            count++;
            map.set(arr1[i], count);
        }
    }

    for (let i = 0; i < N; i++) {
        if (!map.has(arr2[i]))
            return false;
        if (map.get(arr2[i]) == 0)
            return false;
        count = map.get(arr2[i]);
        --count;
        map.set(arr2[i], count);
    }
    return true;
}

function genericInput() {
    let main = document.createElement("div")
    main.classList.add("DarkDiv")
    main.style.width = "100%"
    main.style.height = "30px"

    let inp = document.createElement("input")
    inp.classList.add("JetBrainsFont")
    inp.style.backgroundColor = "transparent"
    inp.style.width = "100%"
    inp.style.height = "100%"
    inp.style.color = "white"
    inp.style.fontSize = "12px"
    inp.style.whiteSpace = "nowrap"
    inp.style.outline = "none"
    inp.style.border = "none"

    main.appendChild(inp)
    return main
}

function choseChat(item, target_holder, message_holder) {
    if (item.nodeName != "DIV") return
    for (let node of target_holder.children) {
        node.classList.remove("active")
    }
    item.classList.add("active");
    message_holder.innerHTML = "";
}

function messageWrap(role) {
    let newDiv = document.createElement("div");
    newDiv.classList.add("ChatMessage");
    newDiv.classList.add("MDRenderDivStyle")

    let newContainer = document.createElement("div");
    newContainer.style.width = "100%"
    newContainer.style.height = "fit-content";
    newContainer.style.maxWidth = "100%";

    let lowerContainer = document.createElement("div");
    lowerContainer.style.width = "fit-content";
    lowerContainer.style.height = "fit-content";
    lowerContainer.classList.add("PosHorizontally");
    lowerContainer.style.maxWidth = "100%";

    let newHashtag = document.createElement("div");
    newHashtag.classList.add("HashtagCard");
    newHashtag.classList.add("GoogleCodeFont");
    newHashtag.style.height = "25px"
    newHashtag.style.fontSize = "14px"
    newHashtag.style.margin = "5px"
    newHashtag.style.width = "fit-content";
    newHashtag.style.fontWeight = "bold"

    newHashtag.textContent = role

    let cval = Math.round(Math.random() * 360 - 1)
    newHashtag.style.setProperty("--random-color", "hsl(" + cval + ", 65%, 60%)")
    newHashtag.style.setProperty("--random-color-1", "hsl(" + cval + ", 65%, 45%)")
    newHashtag.style.color = "hsl(" + cval + ", 65%, 30%)"

    if (role == "user") {
        lowerContainer.style.float = "right";
        lowerContainer.appendChild(newHashtag)
        lowerContainer.appendChild(newDiv)
    } else if (role == "assistant") {
        lowerContainer.style.float = "left";
        lowerContainer.appendChild(newDiv)
        lowerContainer.appendChild(newHashtag)
    } else if (["system","tool"].includes(role)) {
        newDiv.style.border = "3px dashed #ff9900";
        newDiv.style.backgroundColor = "#694001";
        newDiv.style.opacity = "0.7";
        lowerContainer.style.float = "left";
        lowerContainer.appendChild(newDiv)
        lowerContainer.appendChild(newHashtag)
    }

    newDiv.style.marginTop = "5px"

    newContainer.appendChild(lowerContainer)

    return newContainer;
}

function collapseWrap(contents, header) {
    let newArrow = '<span class="Arrow NoSelect" draggable="false"><span></span><span></span></span>'
    let placeholder = document.createElement("div");
    placeholder.innerHTML = newArrow;
    newArrow = placeholder.firstElementChild;
    newArrow.style.color = "#515151"
    newArrow.style.rotate = "-90deg"
    newArrow.style.transition = "all .1s ease-in-out"
    newArrow.style.margin = "0"
    newArrow.style.lineHeight = "100%"
    newArrow.style.scale = "0.6"
    newArrow.style.cursor = "pointer"

    let HeaderContainer = document.createElement("div");
    HeaderContainer.style.width = "100%";
    HeaderContainer.style.height = "fit-content";
    HeaderContainer.style.maxWidth = "100%";
    HeaderContainer.style.gap = "10px";
    HeaderContainer.classList.add("PosHorizontally");
    HeaderContainer.style.gap = "5px"

    let newHeader = document.createElement("p");
    newHeader.classList.add("SenFont")
    newHeader.style.color = "white"
    newHeader.style.fontSize = "16px"
    newHeader.style.fontWeight = "bold"
    newHeader.style.margin = "0"
    newHeader.style.padding = "0"
    newHeader.style.verticalAlign = "middle"
    newHeader.textContent = header;
    newHeader.style.cursor = "pointer"
    newHeader.style.transition = "all .1s ease-in-out"
    newHeader.style.whiteSpace = "nowrap"

    HeaderContainer.appendChild(newArrow);
    HeaderContainer.appendChild(newHeader);

    let generalContainer = document.createElement("div");
    generalContainer.style.width = "100%";
    generalContainer.style.height = "fit-content";
    generalContainer.classList.add("PosVertically");
    generalContainer.style.maxWidth = "100%";

    let contentContainer = document.createElement("div");
    contentContainer.style.width = "100%";
    contentContainer.style.height = "fit-content";
    contentContainer.appendChild(contents)
    contentContainer.style.display = "none"
    contentContainer.style.marginLeft = "10px"
    contentContainer.style.paddingLeft = "14px"
    contentContainer.style.marginTop = "10px"
    contentContainer.style.maxWidth = "100%"
    contentContainer.style.borderLeftWidth = "1px"
    contentContainer.style.borderLeftStyle = "solid"
    contentContainer.style.borderImage = "linear-gradient(to bottom, white, white calc(100% - 10px), transparent calc(100% - 10px), transparent) 1"

    function clickcallback() {
        if (newArrow.style.rotate == "-90deg") {
            newArrow.style.rotate = "0deg"
            contentContainer.style.display = "inline-block";
            newHeader.style.background = "linear-gradient(to bottom, #ff9900, #ff4400)";
            newHeader.style.backgroundClip = "text"
            newHeader.style.color = "transparent"
        } else {
            newArrow.style.rotate = "-90deg"
            contentContainer.style.display = "none"
            newHeader.style.color = "white"
            newHeader.style.backgroundColor = 'none'
            newHeader.style.backgroundClip = "none"
        }
    }

    newArrow.onclick = clickcallback;
    newHeader.onclick = clickcallback;


    generalContainer.appendChild(HeaderContainer)
    generalContainer.appendChild(contentContainer);

    return generalContainer;
}

function genericEmptyInstancePull(name) {
    let newDiv = document.createElement("div");
    newDiv.style.padding = "10px";
    newDiv.style.width = "calc(100% - 25px)";
    newDiv.style.height = "fit-content";
    newDiv.classList.add("DarkDiv")

    let newLabel = document.createElement("p");
    newLabel.style.color = "white"
    newLabel.style.fontSize = "16px"
    newLabel.style.fontWeight = "bold"
    newLabel.classList.add("JetBrainsFont")
    newLabel.style.whiteSpace = "nowrap"
    newLabel.textContent = name
    newLabel.style.lineHeight = "100%"
    newLabel.style.margin = "0"

    newDiv.style.cursor = "grab"
    newDiv.appendChild(newLabel);
    return newDiv
}

function visualizeAnInstance(name, instancePull) {
    let instanceContainer = document.createElement("div")
    instanceContainer.style.width = "calc(100% - 10px)"
    instanceContainer.style.height = "fit-content"
    instanceContainer.classList.add("SearchTile")
    instanceContainer.style.borderRadius = "10px"
    instanceContainer.style.padding = "5px"
    instanceContainer.style.margin = "5px"
    instanceContainer.style.marginBottom = "10px"
    instanceContainer.style.transition = "all 0.2s ease-in-out"

    let settingsContainer = document.createElement("div")
    settingsContainer.style.maxWidth = "100%"
    settingsContainer.style.height = "fit-content"


    let outerDeepThinkContainer = document.createElement("div")
    outerDeepThinkContainer.classList.add("PosVertically")
    outerDeepThinkContainer.style.height = "40px"

    let deepThinkContainer = document.createElement("div")
    deepThinkContainer.style.width = "calc(100% - 25px)"
    deepThinkContainer.style.display = "flex"
    deepThinkContainer.style.gap = "5px"
    deepThinkContainer.classList.add("PosHorizontally")

    let deepThinkSlider = document.createElement("input")
    deepThinkSlider.type = "range"
    deepThinkSlider.style.flexGrow = "1"
    deepThinkSlider.style.height = "10px"
    deepThinkSlider.min = "0"
    deepThinkSlider.max = "4"
    deepThinkSlider.value = "0"
    deepThinkSlider.classList.add("CustomSlider")
    deepThinkSlider.oninput = (e) => {
        let gradspec = ((1/4)*deepThinkSlider.value*100).toFixed(3);
        deepThinkSlider.style.background = "linear-gradient(to right, #ff4400, #ff9900 "+gradspec+"%, #1b1b1b "+gradspec+"%, #1b1b1b)"
    }

    let deepThinkLabel = document.createElement("p")
    deepThinkLabel.style.color = "white"
    deepThinkLabel.style.fontSize = "13px"
    deepThinkLabel.style.whiteSpace = "nowrap"
    deepThinkLabel.classList.add("JetBrainsFont")
    deepThinkLabel.textContent = "Deep Thinking"
    deepThinkLabel.style.lineHeight = "100%"
    deepThinkLabel.style.margin = "0"

    let noneLabel = document.createElement("p")
    noneLabel.style.color = "#4e4e4e"
    noneLabel.style.fontSize = "13px"
    noneLabel.style.whiteSpace = "nowrap"
    noneLabel.classList.add("JetBrainsFont")
    noneLabel.textContent = "None"
    noneLabel.style.lineHeight = "100%"
    noneLabel.style.margin = "0"
    noneLabel.style.position = "absolute"
    noneLabel.style.left = "0"

    let normalLabel = document.createElement("p")
    normalLabel.style.color = "#4e4e4e"
    normalLabel.style.fontSize = "13px"
    normalLabel.style.whiteSpace = "nowrap"
    normalLabel.classList.add("JetBrainsFont")
    normalLabel.textContent = "Normal"
    normalLabel.style.textAlign = "center"
    normalLabel.style.lineHeight = "100%"
    normalLabel.style.margin = "0"
    normalLabel.style.position = "absolute"
    normalLabel.style.left = "0"
    normalLabel.style.width = "calc(100% - 25px)"

    let maxLabel = document.createElement("p")
    maxLabel.style.color = "#4e4e4e"
    maxLabel.style.fontSize = "13px"
    maxLabel.style.whiteSpace = "nowrap"
    maxLabel.classList.add("JetBrainsFont")
    maxLabel.textContent = "Max"
    maxLabel.style.lineHeight = "100%"
    maxLabel.style.margin = "0"
    maxLabel.style.position = "absolute"
    maxLabel.style.transform = "translateX(-100%)"
    maxLabel.style.left = "calc(100% - 25px)"
    maxLabel.style.textAlign = "right"

    let underlineDeepThinkContainer = document.createElement("div")
    underlineDeepThinkContainer.style.width = "calc(100% - 107.5px)"
    underlineDeepThinkContainer.style.marginLeft = "107.5px"
    underlineDeepThinkContainer.style.marginTop = "5px"
    underlineDeepThinkContainer.style.display = "flex"
    underlineDeepThinkContainer.classList.add("PosHorizontally")
    underlineDeepThinkContainer.appendChild(noneLabel)
    underlineDeepThinkContainer.appendChild(normalLabel)
    underlineDeepThinkContainer.appendChild(maxLabel)
    deepThinkContainer.appendChild(deepThinkLabel)
    deepThinkContainer.appendChild(deepThinkSlider)
    outerDeepThinkContainer.appendChild(deepThinkContainer)
    outerDeepThinkContainer.appendChild(underlineDeepThinkContainer)



    let outerTemperatureContainer = document.createElement("div")
    outerTemperatureContainer.classList.add("PosVertically")
    outerTemperatureContainer.style.height = "40px"

    let temperatureContainer = document.createElement("div")
    temperatureContainer.style.width = "calc(100% - 25px)"
    temperatureContainer.style.display = "flex"
    temperatureContainer.style.gap = "5px"
    temperatureContainer.classList.add("PosHorizontally")

    let temperatureSlider = document.createElement("input")
    temperatureSlider.type = "range"
    temperatureSlider.style.flexGrow = "1"
    temperatureSlider.style.height = "10px"
    temperatureSlider.min = "1"
    temperatureSlider.max = "100"
    temperatureSlider.value = "1"
    temperatureSlider.classList.add("CustomSlider")
    temperatureSlider.oninput = (e) => {
        let gradspec = ((1/100)*temperatureSlider.value*100).toFixed(3);
        temperatureSlider.style.background = "linear-gradient(to right, #ff4400, #ff9900 "+gradspec+"%, #1b1b1b "+gradspec+"%, #1b1b1b)"
    }

    let temperatureLabel = document.createElement("p")
    temperatureLabel.style.color = "white"
    temperatureLabel.style.fontSize = "13px"
    temperatureLabel.style.whiteSpace = "nowrap"
    temperatureLabel.classList.add("JetBrainsFont")
    temperatureLabel.textContent = "Temperature"
    temperatureLabel.style.minWidth = "101.41px"
    temperatureLabel.style.lineHeight = "100%"
    temperatureLabel.style.margin = "0"

    let T0 = document.createElement("p")
    T0.style.color = "#4e4e4e"
    T0.style.fontSize = "13px"
    T0.style.whiteSpace = "nowrap"
    T0.classList.add("JetBrainsFont")
    T0.textContent = "0.0"
    T0.style.lineHeight = "100%"
    T0.style.margin = "0"
    T0.style.position = "absolute"
    T0.style.left = "0"

    let T50 = document.createElement("p")
    T50.style.color = "#4e4e4e"
    T50.style.fontSize = "13px"
    T50.style.whiteSpace = "nowrap"
    T50.classList.add("JetBrainsFont")
    T50.textContent = "0.5"
    T50.style.textAlign = "center"
    T50.style.lineHeight = "100%"
    T50.style.margin = "0"
    T50.style.position = "absolute"
    T50.style.left = "0"
    T50.style.width = "calc(100% - 25px)"

    let T100 = document.createElement("p")
    T100.style.color = "#4e4e4e"
    T100.style.fontSize = "13px"
    T100.style.whiteSpace = "nowrap"
    T100.classList.add("JetBrainsFont")
    T100.textContent = "1.0"
    T100.style.lineHeight = "100%"
    T100.style.margin = "0"
    T100.style.position = "absolute"
    T100.style.transform = "translateX(-100%)"
    T100.style.left = "calc(100% - 25px)"
    T100.style.textAlign = "right"

    let underlineTemperatureContainer = document.createElement("div")
    underlineTemperatureContainer.style.width = "calc(100% - 107.5px)"
    underlineTemperatureContainer.style.marginLeft = "107.5px"
    underlineTemperatureContainer.style.marginTop = "5px"
    underlineTemperatureContainer.style.display = "flex"
    underlineTemperatureContainer.classList.add("PosHorizontally")
    underlineTemperatureContainer.appendChild(T0)
    underlineTemperatureContainer.appendChild(T50)
    underlineTemperatureContainer.appendChild(T100)
    temperatureContainer.appendChild(temperatureLabel)
    temperatureContainer.appendChild(temperatureSlider)
    outerTemperatureContainer.appendChild(temperatureContainer)
    outerTemperatureContainer.appendChild(underlineTemperatureContainer)



    let outertoppContainer = document.createElement("div")
    outertoppContainer.classList.add("PosVertically")
    outertoppContainer.style.height = "40px"

    let toppContainer = document.createElement("div")
    toppContainer.style.width = "calc(100% - 25px)"
    toppContainer.style.display = "flex"
    toppContainer.style.gap = "5px"
    toppContainer.classList.add("PosHorizontally")

    let toppSlider = document.createElement("input")
    toppSlider.type = "range"
    toppSlider.style.flexGrow = "1"
    toppSlider.style.height = "10px"
    toppSlider.min = "1"
    toppSlider.max = "100"
    toppSlider.value = "1"
    toppSlider.classList.add("CustomSlider")
    toppSlider.oninput = (e) => {
        let gradspec = ((1/100)*toppSlider.value*100).toFixed(3);
        toppSlider.style.background = "linear-gradient(to right, #ff4400, #ff9900 "+gradspec+"%, #1b1b1b "+gradspec+"%, #1b1b1b)"
    }

    let toppLabel = document.createElement("p")
    toppLabel.style.color = "white"
    toppLabel.style.fontSize = "13px"
    toppLabel.style.whiteSpace = "nowrap"
    toppLabel.classList.add("JetBrainsFont")
    toppLabel.textContent = "Top-p"
    toppLabel.style.minWidth = "101.41px"
    toppLabel.style.lineHeight = "100%"
    toppLabel.style.margin = "0"

    let TPP0 = document.createElement("p")
    TPP0.style.color = "#4e4e4e"
    TPP0.style.fontSize = "13px"
    TPP0.style.whiteSpace = "nowrap"
    TPP0.classList.add("JetBrainsFont")
    TPP0.textContent = "0.0"
    TPP0.style.lineHeight = "100%"
    TPP0.style.margin = "0"
    TPP0.style.position = "absolute"
    TPP0.style.left = "0"

    let TPP50 = document.createElement("p")
    TPP50.style.color = "#4e4e4e"
    TPP50.style.fontSize = "13px"
    TPP50.style.whiteSpace = "nowrap"
    TPP50.classList.add("JetBrainsFont")
    TPP50.textContent = "0.5"
    TPP50.style.textAlign = "center"
    TPP50.style.lineHeight = "100%"
    TPP50.style.margin = "0"
    TPP50.style.position = "absolute"
    TPP50.style.left = "0"
    TPP50.style.width = "calc(100% - 25px)"

    let TPP100 = document.createElement("p")
    TPP100.style.color = "#4e4e4e"
    TPP100.style.fontSize = "13px"
    TPP100.style.whiteSpace = "nowrap"
    TPP100.classList.add("JetBrainsFont")
    TPP100.textContent = "1.0"
    TPP100.style.lineHeight = "100%"
    TPP100.style.margin = "0"
    TPP100.style.position = "absolute"
    TPP100.style.transform = "translateX(-100%)"
    TPP100.style.left = "calc(100% - 25px)"
    TPP100.style.textAlign = "right"

    let underlinetppContainer = document.createElement("div")
    underlinetppContainer.style.width = "calc(100% - 107.5px)"
    underlinetppContainer.style.marginLeft = "107.5px"
    underlinetppContainer.style.marginTop = "5px"
    underlinetppContainer.style.display = "flex"
    underlinetppContainer.classList.add("PosHorizontally")
    underlinetppContainer.appendChild(TPP0)
    underlinetppContainer.appendChild(TPP50)
    underlinetppContainer.appendChild(TPP100)
    toppContainer.appendChild(toppLabel)
    toppContainer.appendChild(toppSlider)
    outertoppContainer.appendChild(toppContainer)
    outertoppContainer.appendChild(underlinetppContainer)



    let outerrppContainer = document.createElement("div")
    outerrppContainer.classList.add("PosVertically")
    outerrppContainer.style.height = "40px"

    let rppContainer = document.createElement("div")
    rppContainer.style.width = "calc(100% - 25px)"
    rppContainer.style.display = "flex"
    rppContainer.style.gap = "5px"
    rppContainer.classList.add("PosHorizontally")

    let rppSlider = document.createElement("input")
    rppSlider.type = "range"
    rppSlider.style.flexGrow = "1"
    rppSlider.style.height = "10px"
    rppSlider.min = "80"
    rppSlider.max = "140"
    rppSlider.value = "80"
    rppSlider.classList.add("CustomSlider")
    rppSlider.oninput = (e) => {
        let gradspec = ((1/60)*(rppSlider.value-80)*100).toFixed(3);
        rppSlider.style.background = "linear-gradient(to right, #ff4400, #ff9900 "+gradspec+"%, #1b1b1b "+gradspec+"%, #1b1b1b)"
    }

    let rppLabel = document.createElement("p")
    rppLabel.style.color = "white"
    rppLabel.style.fontSize = "13px"
    rppLabel.classList.add("JetBrainsFont")
    rppLabel.textContent = "Repetition Penalty"
    rppLabel.style.minWidth = "101.41px"
    rppLabel.style.maxWidth = "101.41px"
    rppLabel.style.lineHeight = "120%"
    rppLabel.style.margin = "0"

    let RPP0 = document.createElement("p")
    RPP0.style.color = "#4e4e4e"
    RPP0.style.fontSize = "13px"
    RPP0.style.whiteSpace = "nowrap"
    RPP0.classList.add("JetBrainsFont")
    RPP0.textContent = "0.8"
    RPP0.style.lineHeight = "100%"
    RPP0.style.margin = "0"
    RPP0.style.position = "absolute"
    RPP0.style.left = "0"

    let RPP50 = document.createElement("p")
    RPP50.style.color = "#4e4e4e"
    RPP50.style.fontSize = "13px"
    RPP50.style.whiteSpace = "nowrap"
    RPP50.classList.add("JetBrainsFont")
    RPP50.textContent = "1.1"
    RPP50.style.textAlign = "center"
    RPP50.style.lineHeight = "100%"
    RPP50.style.margin = "0"
    RPP50.style.position = "absolute"
    RPP50.style.left = "0"
    RPP50.style.width = "calc(100% - 25px)"

    let RPP100 = document.createElement("p")
    RPP100.style.color = "#4e4e4e"
    RPP100.style.fontSize = "13px"
    RPP100.style.whiteSpace = "nowrap"
    RPP100.classList.add("JetBrainsFont")
    RPP100.textContent = "1.4"
    RPP100.style.lineHeight = "100%"
    RPP100.style.margin = "0"
    RPP100.style.position = "absolute"
    RPP100.style.transform = "translateX(-100%)"
    RPP100.style.left = "calc(100% - 25px)"
    RPP100.style.textAlign = "right"

    let underlineRPPContainer = document.createElement("div")
    underlineRPPContainer.style.width = "calc(100% - 107.5px)"
    underlineRPPContainer.style.marginLeft = "107.5px"
    underlineRPPContainer.style.position = "absolute"
    underlineRPPContainer.style.top = "12px"
    underlineRPPContainer.style.marginTop = "5px"
    underlineRPPContainer.style.display = "flex"
    underlineRPPContainer.classList.add("PosHorizontally")
    underlineRPPContainer.appendChild(RPP0)
    underlineRPPContainer.appendChild(RPP50)
    underlineRPPContainer.appendChild(RPP100)
    rppContainer.appendChild(rppLabel)
    rppContainer.appendChild(rppSlider)
    outerrppContainer.appendChild(rppContainer)
    outerrppContainer.appendChild(underlineRPPContainer)



    let samplingLabel = document.createElement("p")
    samplingLabel.style.color = "white"
    samplingLabel.style.fontSize = "13px"
    samplingLabel.style.whiteSpace = "nowrap"
    samplingLabel.classList.add("JetBrainsFont")
    samplingLabel.textContent = "Sampling"
    samplingLabel.style.lineHeight = "100%"
    samplingLabel.style.margin = "0"
    samplingLabel.style.minWidth = "101.41px"

    let samplingCheckbox = document.createElement("input")
    samplingCheckbox.type = "checkbox"
    samplingCheckbox.classList.add("CustomCheckbox")
    samplingCheckbox.onclick = (e) => {
        if (samplingCheckbox.checked) {
            samplingContainer.before(topkContainer)
        } else {
            settingsContainer.removeChild(topkContainer)
        }
    }

    let samplingContainer = document.createElement("div")
    samplingContainer.style.width = "100%"
    samplingContainer.style.width = "calc(100% - 25px)"
    samplingContainer.style.display = "flex"
    samplingContainer.style.gap = "5px"
    samplingContainer.classList.add("PosHorizontally")
    samplingContainer.style.alignItems = "center"
    samplingContainer.style.marginBottom = "5px"

    samplingContainer.appendChild(samplingLabel)
    samplingContainer.appendChild(samplingCheckbox)



    let topkLabel = document.createElement("p")
    topkLabel.style.color = "white"
    topkLabel.style.fontSize = "13px"
    topkLabel.style.whiteSpace = "nowrap"
    topkLabel.classList.add("JetBrainsFont")
    topkLabel.textContent = "Top-k"
    topkLabel.style.lineHeight = "100%"
    topkLabel.style.margin = "0"
    topkLabel.style.minWidth = "101.41px"

    let topkInput = genericInput()
    topkInput.firstElementChild.type = "number"
    topkInput.firstElementChild.min = "1"
    topkInput.firstElementChild.placeholder = "Integer Value..."
    topkInput.firstElementChild.step = "5"

    let topkContainer = document.createElement("div")
    topkContainer.style.width = "100%"
    topkContainer.style.width = "calc(100% - 25px)"
    topkContainer.style.display = "flex"
    topkContainer.style.gap = "5px"
    topkContainer.classList.add("PosHorizontally")
    topkContainer.style.alignItems = "center"
    topkContainer.style.marginBottom = "5px"

    topkContainer.appendChild(topkLabel)
    topkContainer.appendChild(topkInput)



    let tokenLabel = document.createElement("p")
    tokenLabel.style.color = "white"
    tokenLabel.style.fontSize = "13px"
    tokenLabel.style.whiteSpace = "nowrap"
    tokenLabel.classList.add("JetBrainsFont")
    tokenLabel.textContent = "Token Limit"
    tokenLabel.style.lineHeight = "100%"
    tokenLabel.style.margin = "0"
    tokenLabel.style.minWidth = "101.41px"

    let tokenInput = genericInput()
    tokenInput.firstElementChild.type = "number"
    tokenInput.firstElementChild.min = "1"
    tokenInput.firstElementChild.placeholder = "Integer Value..."
    tokenInput.firstElementChild.step = "5"

    let tokenContainer = document.createElement("div")
    tokenContainer.style.width = "100%"
    tokenContainer.style.width = "calc(100% - 25px)"
    tokenContainer.style.display = "flex"
    tokenContainer.style.gap = "5px"
    tokenContainer.classList.add("PosHorizontally")
    tokenContainer.style.alignItems = "center"
    tokenContainer.style.marginBottom = "5px"

    tokenContainer.appendChild(tokenLabel)
    tokenContainer.appendChild(tokenInput)



    let thinkingTokenLabel = document.createElement("p")
    thinkingTokenLabel.style.color = "white"
    thinkingTokenLabel.style.fontSize = "13px"
    thinkingTokenLabel.classList.add("JetBrainsFont")
    thinkingTokenLabel.textContent = "Thinking Token Limit"
    thinkingTokenLabel.style.maxWidth = "101.41px"
    thinkingTokenLabel.style.lineHeight = "100%"
    thinkingTokenLabel.style.margin = "0"
    thinkingTokenLabel.style.minWidth = "101.41px"
    thinkingTokenLabel.style.lineHeight = "120%"

    let thinkingTokenInput = genericInput()
    thinkingTokenInput.firstElementChild.type = "number"
    thinkingTokenInput.firstElementChild.min = "1"
    thinkingTokenInput.firstElementChild.placeholder = "Integer Value..."
    thinkingTokenInput.firstElementChild.step = "5"

    let thinkingTokenContainer = document.createElement("div")
    thinkingTokenContainer.style.width = "100%"
    thinkingTokenContainer.style.width = "calc(100% - 25px)"
    thinkingTokenContainer.style.display = "flex"
    thinkingTokenContainer.style.gap = "5px"
    thinkingTokenContainer.classList.add("PosHorizontally")
    thinkingTokenContainer.style.alignItems = "center"
    thinkingTokenContainer.style.marginBottom = "5px"

    thinkingTokenContainer.appendChild(thinkingTokenLabel)
    thinkingTokenContainer.appendChild(thinkingTokenInput)

    let chatTemplateLabel = document.createElement("p")
    chatTemplateLabel.style.color = "white"
    chatTemplateLabel.style.fontSize = "13px"
    chatTemplateLabel.style.whiteSpace = "nowrap"
    chatTemplateLabel.classList.add("JetBrainsFont")
    chatTemplateLabel.textContent = "Chat Template"
    chatTemplateLabel.style.lineHeight = "100%"
    chatTemplateLabel.style.margin = "0"
    chatTemplateLabel.style.minWidth = "101.41px"

    let temp_Div = document.createElement("div")
    temp_Div.innerHTML = '<div class="DarkDiv" style="padding: 5px; z-index: 500; box-shadow: 0 10px 10px rgba(0,0,0,0.2); border-radius: 10px; width: 100%; height: fit-content; min-height: 80px">' +
        '    <textarea style=\"width: 100%; height: fit-content; color: white; font-size: 12px; resize: none; field-sizing: content; background-color: transparent; border: transparent; outline: none\" class=\"JetBrainsFont\" placeholder=\"Any custom chat template (will not apply if unfilleld)\"></textarea>' +
        '</div>'
    let chatTemplateInput = temp_Div.firstElementChild
    chatTemplateInput.style.width = "calc(100% - 106.41px)"
    chatTemplateInput.style.maxWidth = "calc(100% - 106.41px)"
    chatTemplateInput.style.maxWidth = "100%"

    let chatTemplateContainer = document.createElement("div")
    chatTemplateContainer.style.width = "100%"
    chatTemplateContainer.style.width = "calc(100% - 25px)"
    chatTemplateContainer.style.display = "flex"
    chatTemplateContainer.style.gap = "5px"
    chatTemplateContainer.classList.add("PosHorizontally")
    chatTemplateContainer.style.alignItems = "center"
    chatTemplateContainer.style.marginBottom = "5px"

    chatTemplateContainer.appendChild(chatTemplateLabel)
    chatTemplateContainer.appendChild(chatTemplateInput)
    settingsContainer.appendChild(outerDeepThinkContainer)
    settingsContainer.appendChild(outerTemperatureContainer)
    settingsContainer.appendChild(outertoppContainer)
    settingsContainer.appendChild(outerrppContainer)
    settingsContainer.appendChild(samplingContainer)
    settingsContainer.appendChild(tokenContainer)
    settingsContainer.appendChild(thinkingTokenContainer)
    settingsContainer.appendChild(chatTemplateContainer)

    let instancePullWrapper = document.createElement("div")
    instancePullWrapper.classList.add("PosHorizontally")
    instancePullWrapper.style.display = "flex"
    instancePullWrapper.style.flexDirection = "row"
    instancePullWrapper.style.width = "calc(100% - 27px)"
    instancePullWrapper.style.marginTop = "10px"
    instancePullWrapper.style.marginBottom = "10px"
    instancePullWrapper.style.alignItems = "center"
    instancePullWrapper.style.gap = "5px"

    let instancePullLabel = document.createElement("p")
    instancePullLabel.style.fontSize = "16px"
    instancePullLabel.classList.add("SenFont")
    instancePullLabel.textContent = "USE THIS INSTANCE"
    instancePullLabel.style.lineHeight = "100%"
    instancePullLabel.style.fontWeight = "bold"
    instancePullLabel.style.margin = "0"
    instancePullLabel.style.minWidth = "101.41px"
    instancePullLabel.style.lineHeight = "120%"
    instancePullLabel.style.background = "linear-gradient(to bottom, #ff9900, #ff4400)";
    instancePullLabel.style.backgroundClip = "text"
    instancePullLabel.style.color = "transparent"

    let divider = document.createElement("div")
    divider.style.flexShrink = "0"
    divider.style.height = "3px"
    divider.style.flexGrow = "1"
    divider.style.backgroundImage = "linear-gradient(to left, #ff4400, #ff9900)"
    divider.style.transition = "all 0.25s"
    divider.style.borderRadius = "1.5px"

    instancePullWrapper.appendChild(instancePullLabel)
    instancePullWrapper.appendChild(divider)
    settingsContainer.appendChild(instancePullWrapper)
    settingsContainer.appendChild(instancePull)

    let instanceWipeButton = genericEmptyInstancePull("WIPE "+name)
    instanceWipeButton.classList.remove("DarkDiv")
    instanceWipeButton.classList.add("SearchTile")
    instanceWipeButton.style.backgroundColor = "#ff1f1f"
    instanceWipeButton.style.borderColor = "#b60000"
    instanceWipeButton.style.cursor = "pointer"
    instanceWipeButton.style.borderWidth = "2px"
    instanceWipeButton.style.borderRadius = "10px"
    instanceWipeButton.style.marginTop = "10px"
    instanceWipeButton.style.marginBottom = "10px"

    settingsContainer.appendChild(instanceWipeButton)

    instanceContainer.appendChild(collapseWrap(settingsContainer, name))
    return instanceContainer;
}

window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS.push(
    (mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length === 0) return
            mutation.addedNodes.forEach(node => {
                if (!(node.nodeType === 1)) return
                if (node.getAttribute("itemext") === "core-modelSearch") {
                    node.children[0].children[0].children[0].addEventListener("keydown", (e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            quickSearch()
                        }
                    })
                }
                if (node.getAttribute("itemext") === "core-modelInfo") {
                    let card = document.getElementById("core-modelInfo-cardRender")
                    let target = document.getElementById("core-modelInfo-entry")
                    let star = document.getElementById("core-modelInfo-star").parentElement.children[0]

                    card.children[1].onclick = async () => {
                        star.parentElement.children[0].classList.toggle("active")
                        if (star.parentElement.children[0].classList.contains("active")) {
                            let particle_clump = window.ParticleSystem.clumpParticles(
                                10, star.parentElement.children[1].id, 1.1, 1.03
                            )
                            particle_clump = window.ParticleSystem.styleAll(
                                particle_clump, window.ParticleSystem.yellowSparkParticleStyle
                            )
                            let new_key = await window.ParticleSystem.generateKey()
                            window.ParticleSystem.animateParticleClump(
                                new_key, particle_clump, true, 10, 1500, "spark"
                            )
                            window.favorites.push(star.getAttribute('currentJob'))
                        } else {
                            let id = window.favorites.indexOf(
                                star.getAttribute('currentJob'))
                            if (window.favorites.includes(star.getAttribute('currentJob')) && id > -1) {
                                window.favorites.splice(id,
                                    1)
                            }
                        }
                        window.bounceWhenClicked(star)
                    }
                    target.parentElement.removeChild(card)

                    target.addEventListener("dragenter", () => {
                        target.firstElementChild.classList.add("AuroraRim-rim")
                        target.classList.add("AuroraRim")
                        target.firstElementChild.style.opacity = "1"
                    })

                    target.addEventListener("dragleave", () => {
                        target.firstElementChild.classList.remove("AuroraRim-rim")
                        target.classList.remove("AuroraRim")
                        target.firstElementChild.style.opacity = "0"
                    })

                    target.addEventListener("dragover", (e) => {
                        e.preventDefault();
                        target.firstElementChild.classList.add("AuroraRim-rim")
                        target.classList.add("AuroraRim")
                        target.firstElementChild.style.opacity = "1"
                        e.dataTransfer.dropEffect = 'move';
                    });

                    target.addEventListener("drop", (e) => {
                        if (!Array.from(target.parentElement.childNodes).some(i => i === card)) {
                            target.parentElement.appendChild(card)
                        }
                        e.preventDefault();
                        target.firstElementChild.classList.remove("AuroraRim-rim")
                        target.classList.remove("AuroraRim")
                        target.firstElementChild.style.opacity = "0"
                        dragPull(e.dataTransfer.getData('text/plain'), card.lastElementChild, star);
                    })
                }
                if (node.getAttribute("itemext") === "core-favoriteModels") {
                    let container = document.getElementById("core-favoriteModels-container")
                    let prev_res = [];
                    container.innerHTML = "<p class=\"SenFont Center\" style=\"white-space: nowrap; font-size: 14px; color: white; position: absolute; z-index: 991;\">Nothing To Show!</p>"

                    function updateContainer() {
                        if (areEqual(prev_res, window.favorites)) return

                        if (window.favorites.length === 0) container.innerHTML = "<p class=\"SenFont Center\" style=\"white-space: nowrap; font-size: 14px; color: white; position: absolute; z-index: 991;\">Nothing To Show!</p>"
                        else container.innerHTML = ""

                        prev_res = window.favorites.slice()

                        window.favorites.forEach(async task => {
                            if (!task) {return}

                            let result = Array.from(await window.pythonPipelineAPI.interactWithPythonPipeline(
                                {
                                    "object": "search",
                                    "args": [task],
                                    "kwargs": {"limit": 1}
                                }
                            ))[0]

                            let newSpan = document.createElement("span");
                            newSpan.style.padding = "0"
                            newSpan.classList.add("SenFont")
                            newSpan.style.color = "white"
                            newSpan.style.fontSize = "14px"
                            newSpan.textContent = result.id

                            let newContainer = document.createElement("div")
                            newContainer.classList.add("SearchTile")
                            newContainer.style.width = "calc(100% - 20px)"
                            newContainer.style.height = "fit-content"
                            newContainer.style.padding = "10px"
                            newContainer.style.margin = "10px"
                            newContainer.style.marginBottom = "5px"
                            newContainer.draggable = true
                            newContainer.style.cursor = "grab"

                            let group = document.createElement("div")
                            group.classList.add("PosHorizontally")
                            group.style.display = "flex"
                            group.style.width = "100%"
                            group.style.height = "fit-content"
                            group.style.marginTop = "7px"

                            let divline = document.createElement("div")
                            divline.style.width = "0"
                            divline.style.height = "20px"
                            divline.style.margin = "3px"
                            divline.style.flexGrow = "0"
                            divline.style.flexShrink = "0"
                            divline.style.border = "#6c6c6c solid 1px"
                            divline.style.borderRadius = "1px"

                            let likes_container = document.createElement("div")
                            likes_container.style.flex = "1"
                            likes_container.style.gap = "10px"
                            likes_container.style.alignItems = "center"
                            likes_container.style.display = "flex"
                            likes_container.style.justifyContent = "center"
                            likes_container.style.flexDirection = "row"
                            let likes_img = document.createElement("img")
                            likes_img.src = SVGs["like"]
                            likes_img.classList.add("NoSelect")
                            likes_img.style.width = "20px"
                            likes_img.style.height = "20px"
                            likes_img.style.filter = "invert(0.8)"
                            let likes_text = document.createElement("p")
                            likes_text.classList.add("SenFont")
                            likes_text.classList.add("NoSelect")
                            likes_text.style.color = "white"
                            likes_text.style.fontSize = "14px"
                            likes_text.style.whiteSpace = "nowrap"
                            likes_text.style.margin = "3px"
                            likes_text.textContent = await window.pythonPipelineAPI.interactWithPythonPipeline(
                                {
                                    "object": "parse_amount",
                                    "args": [result.likes],
                                    "kwargs": {}
                                }
                            )
                            likes_container.appendChild(likes_img)
                            likes_container.appendChild(likes_text)
                            group.appendChild(likes_container)

                            group.appendChild(divline.cloneNode(false))

                            let downloads_container = document.createElement("div")
                            downloads_container.style.flex = "1"
                            downloads_container.style.gap = "10px"
                            downloads_container.style.alignItems = "center"
                            downloads_container.style.display = "flex"
                            downloads_container.style.justifyContent = "center"
                            downloads_container.style.flexDirection = "row"
                            let downloads_img = document.createElement("img")
                            downloads_img.src = SVGs["download"]
                            downloads_img.classList.add("NoSelect")
                            downloads_img.style.width = "20px"
                            downloads_img.style.height = "20px"
                            downloads_img.style.filter = "invert(0.8)"
                            let downloads_text = document.createElement("p")
                            downloads_text.classList.add("SenFont")
                            downloads_text.classList.add("NoSelect")
                            downloads_text.style.color = "white"
                            downloads_text.style.fontSize = "14px"
                            downloads_text.style.whiteSpace = "nowrap"
                            downloads_text.style.margin = "3px"
                            downloads_text.textContent = await window.pythonPipelineAPI.interactWithPythonPipeline(
                                {
                                    "object": "parse_amount",
                                    "args": [result.downloads],
                                    "kwargs": {}
                                }
                            )
                            downloads_container.appendChild(downloads_img)
                            downloads_container.appendChild(downloads_text)
                            group.appendChild(downloads_container)

                            group.appendChild(divline)

                            let tags_container = document.createElement("div")
                            tags_container.style.flex = "1"
                            tags_container.style.gap = "5px"
                            tags_container.style.alignItems = "center"
                            tags_container.style.display = "flex"
                            tags_container.style.justifyContent = "center"
                            tags_container.style.flexDirection = "row"
                            let tags_img = document.createElement("img")
                            tags_img.src = SVGs["hashtag"]
                            tags_img.classList.add("NoSelect")
                            tags_img.style.width = "20px"
                            tags_img.style.height = "20px"
                            tags_img.style.filter = "invert(0.8)"
                            let tags_text = document.createElement("p")
                            tags_text.classList.add("SenFont")
                            tags_text.classList.add("NoSelect")
                            tags_text.style.color = "white"
                            tags_text.style.fontSize = "14px"
                            tags_text.style.whiteSpace = "nowrap"
                            tags_text.style.margin = "3px"
                            tags_text.textContent = result.tags.length
                            tags_container.appendChild(tags_img)
                            tags_container.appendChild(tags_text)
                            group.appendChild(tags_container)

                            newContainer.appendChild(newSpan)
                            newContainer.appendChild(group)
                            container.appendChild(newContainer)

                            newContainer.addEventListener("dragstart", (e) => {
                                e.dataTransfer.setData("text/plain", result.id);
                            });

                        })
                    }

                    (async () => {
                        while (container) {
                            updateContainer()
                            await window.ParticleSystem.sleep(3000)
                        }
                    })()
                }
                if (node.getAttribute("itemext") === "core-chatWindow-block") {
                    let header_container = document.getElementById("core-chatWindow-header-holder")
                    let message_container = header_container.parentElement.parentElement.lastElementChild.firstElementChild
                    header_container.id = null
                    for (let header of header_container.children) {
                        if (header.nodeName != "DIV") continue
                        header.onclick = (e) => {
                            choseChat(header, header_container, message_container)
                        }
                    }
                    header_container.children[header_container.children.length - 1].addEventListener("click", (e) => {
                        let newdiv = document.createElement("div")
                        newdiv.textContent = "New Chat"
                        newdiv.onclick = (e) => {
                            choseChat(newdiv, header_container, message_container)
                        }
                        header_container.lastElementChild.before(newdiv)
                    })

                    let new_message1 = messageWrap("user")
                    new_message1.firstElementChild.lastElementChild.style.width = "400px"
                    new_message1.firstElementChild.lastElementChild.style.height = "200px"
                    let new_message2 = messageWrap("assistant")
                    new_message2.firstElementChild.firstElementChild.style.width = "400px"
                    new_message2.firstElementChild.firstElementChild.style.height = "200px"
                    let new_message3 = messageWrap("system")
                    new_message3.firstElementChild.firstElementChild.style.width = "400px"
                    new_message3.firstElementChild.firstElementChild.style.height = "200px"
                    message_container.appendChild(new_message1)
                    message_container.appendChild(new_message2)
                    message_container.appendChild(new_message3)
                }
                if (node.getAttribute("itemext") === "core-modelManager") {
                    let mainContainer = document.getElementById("core-modelManager-mainContainer")

                    mainContainer.appendChild(visualizeAnInstance("GENERIC MODEL", genericEmptyInstancePull("GENERIC MODEL")))
                }
            })
        }
    }
)

window.EXTENSION_SNIPPET_UNLOAD_MUTATION_CALLBACKS.push((item) => {
    if (item.getAttribute("itemext") === 'core-modelSearch') {
        quickSearch("")
        document.getElementById("search-suggestions").innerHTML = ""
    }
    if (item.getAttribute("itemext") === 'core-modelInfo') {
        let newNode = document.createElement("div")
        newNode.innerHTML = window.EXTENSION_RESOURCE_HOLDER["Core"]["snippets"]["modelInfo"]
        item.innerHTML = newNode.children[0].innerHTML;
    }
    if (item.getAttribute("itemext") === 'core-favoriteModels') {
        let newNode = document.createElement("div")
        newNode.innerHTML = window.EXTENSION_RESOURCE_HOLDER["Core"]["snippets"]["favoriteModels"]
        item.innerHTML = newNode.children[0].innerHTML;
    }
})

window.isFullyLoaded("core-main")