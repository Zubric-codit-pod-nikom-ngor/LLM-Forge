let LAST_QUICK_CALL_TIME = Date.now()
const QUICK_CALL_GAP = 150
let QUICK_CALL_GEN = 0

let StarCounter = 0

let SVGs = {
    "download": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABKElEQVR4nO2ZwUrEMBRFT/qVLmbmN9y+wY0LmZUDgv7JfJIr0f2TQIQSWnUWGdK8e+BBoGnJPQ2BJCCEEEIIIcStmYB9qdwOxwHwUllCOGwmILfDYRKABLgEIAEuAUiAERCTACTAJQAJcAlAAoyAWAQBD8AX8ASkKwTkvqfy7pEN8zkL+VJJWBOQSt+fZx9smNMsSC1hSUAd3svs2SwJeK4CvZVD0FpA7nuu+r6OcGCaViQcKwFDhueXqf2+0l5aL4YgLcyEpRrqz18rYejwf0kIEX5NQqjwcwl3pYZb8IZk6vw2t/n4Dp3f5jYfn3W+fW0+PpMAJMAlAAlwCUACjOACLsB9Z3W5pQDvvJoI2HcQ7L+1ayFgKh9+7Lx2nW7WhBBCCCEEPfEN3kFEPgT6QJMAAAAASUVORK5CYII=",
    "like": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABnUlEQVR4nO3ZMUvDQBiA4RecRAWHgiBuKg4OLt3durgWHN2dRbA6+g8KDo5dCqW4dFMnxbEgdBAHf4CVllpF0MGTQgpFLuldosl9R164qSTkoWm+NIG8PHHdASpYn8A1sInAlGb1gS08gCjgCZjDA4gCTvAE0gNm8QCigF08gdTwBPKIgGYMIO8IaMcAMkBAFwaQexxvCfgygJzjeIcGiNHaw/EeDBDfwDIOt234bbRxvJoh5PQ/D+LW8CAm12ibcYvAR4x92K5hcFXcCIO8xdzxuP0UEOrXjeeKDtJJCGmnDFFAQwdpJYSoDNarDlIVCOnpIAcCIQ0dpCwM0gfWdJCiMEiJkArCIHUiGgqCdKMgHUGQXhSkJQjSiIJUhUD6YVesJLMkC0iJKZWFQOrTIEUhkO40SMEXSJz/JU6eWnFmybi0EM/AKgaFzZKj4AVNJUPIlSkiapbMB58vZAipY1HYLKkEmOMMIS82ENtZkiZkYAMpOgxp2kBsZ0nShxc2d7vrWHZpuPObiW1Gv5+z4Dz+6yclzTiIvLw8D/sBLsSN+7T0tOMAAAAASUVORK5CYII=",
    "hashtag": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABI0lEQVR4nO3UoWrCURzF8bOyokEYPoFYJj7BME2fYJjEtChLYpIVMYlt2ExiG76AGsUHkNnEBxjCygwWtcoBixzPv/w+cOOXe265QAghhBAk0gBOF2dvauXyNGZjauVKNGZhauWqNObb1Mp90JgvUyvXpTFtUys3pDHvpvZm/3Sp+6QgkEn4EX8QeU74IWvVQ8oJP2SGO8vShb+mVq5IY1amVq5CY6amVq5OY0amVq5FY3qmVq5PY5qmVm5MY2qmVm5OY15NrdwPjSmYWrkdjXkytVKPAI4XQw4AHgztzfi/d58RRPi/d5+e6iH837tPU/UQ/u/dp4Y7+6QLO6ZWbkBjGqZWbkJj3kyt3JLGvJhauS2NyZlauT2NSZvaEEIIIeCKM3+VvnCG5ivwAAAAAElFTkSuQmCC",
    "document": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAtElEQVR4nO3WQQrCQBBE0TqFiPc/kiiepiQwCxFcRLpqkun60GQZHukhA6RzReE8AFxXgBDAC8DNCanOjqEY8vx4StdMDbkAuDu+DMUQuDA0QCwYmiByDI2QLRnGDZFhZkAkmFmQcozjz77nbrYEhBUvnB0DGQVSHAPpBmHx/CqQdqvlioF0g1B0uL8LpN1quWIg3SBc5YrCVSCuGMgokOIYyCiQ4hjIKJCjQniQ+btlIAnm3gBxwrjC8DB8AAAAAElFTkSuQmCC"
}

async function quickSearch() {
    const myGeneration = ++QUICK_CALL_GEN

    const container = document.getElementById("search-suggestions")
    let query = document.getElementById("model-search").value
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
            "args": [query, 10],
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
    } catch (err) {
        console.log(err)
        window.notify("Oops! Something went wrong!")
    }
}

window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS.push(
    (mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length === 0) return
            mutation.addedNodes.forEach(node => {
                if (!(node.nodeType === 1)) return
                if (node.getAttribute("itemext") === "core-modelInfo") {
                    let card = document.getElementById("core-modelInfo-cardRender")
                    let target = document.getElementById("core-modelInfo-entry")

                    let star = document.getElementById("core-modelInfo-star").parentElement.children[0]
                    document.getElementById("core-modelInfo-star").id ="core-modelInfo-star-"+StarCounter

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
                        console.log(window.favorites)
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

                    target.id = null
                }
            })
        }
    }
)