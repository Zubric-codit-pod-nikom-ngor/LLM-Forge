window.pythonPipelineAPI = {
    "interactWithPythonPipeline": window.pythonPipelineAPI.interactWithPythonPipeline
};

let EXTENSION_RESOURCE_HOLDER = {}
let EXTENSION_RELATED_SNIPPETS = {}
window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS = []
window.favorites = []


async function injectExtensions() {
    let init_path = ".\\extensions"
    let extensions = await window.pythonPipelineAPI.interactWithPythonPipeline(
        {
            "object": "get_files",
            "args": [init_path],
            "kwargs": {}
        }
    )
    for (let extension of Object.keys(extensions)) {
        if (extensions[extension]["isDir"] !== true) {
            continue
        }
        let extensionContents = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "get_files",
                "args": [init_path + "\\" + extension],
                "kwargs": {}
            }
        )
        for (let file of Object.keys(extensionContents)) {
            let item = extensionContents[file];
            if (item["isDir"] !== false) {
                return
            }
            if (file.endsWith(".css") === true) {
                let stylesheet = document.createElement("link")
                stylesheet.rel = "stylesheet"
                stylesheet.href = init_path + "\\" + extension + "\\" + file
                if (!(Object.keys(EXTENSION_RESOURCE_HOLDER).includes(extension))) {
                    EXTENSION_RESOURCE_HOLDER[extension] = {
                        "assets": [],
                        "snippets": {}
                    }
                }
                EXTENSION_RESOURCE_HOLDER[extension]["assets"].push(stylesheet)
            } else if (file.endsWith(".js") === true) {
                let script = document.createElement("script");
                script.src = init_path + "\\" + extension + "\\" + file
                if (!(Object.keys(EXTENSION_RESOURCE_HOLDER).includes(extension))) {
                    EXTENSION_RESOURCE_HOLDER[extension] = {
                        "assets": [],
                        "snippets": {}
                    }
                }
                EXTENSION_RESOURCE_HOLDER[extension]["assets"].push(script)
            } else if (file.endsWith(".html") === true) {
                let snippet = item["contents"]
                if (!(Object.keys(EXTENSION_RESOURCE_HOLDER).includes(extension))) {
                    EXTENSION_RESOURCE_HOLDER[extension] = {
                        "assets": [],
                        "snippets": {}
                    }
                }
                EXTENSION_RESOURCE_HOLDER[extension]["snippets"][file.split(".")[0]] = snippet
            }
        }
    }
}

function disableExtension(name) {
    console.log("Disabled extension " + name)
    EXTENSION_RESOURCE_HOLDER[name].assets.forEach(asset => {
        if (document.head.contains(asset)) {
            document.head.removeChild(asset)
        } else if (document.body.contains(asset)) {
            document.body.removeChild(asset)
        } else {
            console.error(`Unable to find ${name} for removal`)
        }
    })
}

function enableExtension(name) {
    console.log("Enabled extension " + name)
    EXTENSION_RESOURCE_HOLDER[name].assets.forEach(asset => {
        if (asset.nodeName === 'LINK') {
            document.head.appendChild(asset)
        } else if (asset.nodeName === 'SCRIPT') {
            document.body.appendChild(asset)
        }
    })
}

function notify(message, time = 2500) {
    const applicationContainer = document.getElementById("notification-container");
    let totalHeight = 0;

    const previous = Array.from(applicationContainer.children).map((el) => ({
        el,
        top: el.getBoundingClientRect().top,
        transform: getComputedStyle(el).transform,
    }));

    const newContainer = document.createElement("div");
    newContainer.classList.add("DarkDiv", "PosHorizontally", "NoSelect");
    newContainer.style.width = "fit-content";
    newContainer.style.height = "fit-content";
    newContainer.style.padding = "5px";
    newContainer.style.marginTop = "3px";
    newContainer.style.marginBottom = "3px";
    newContainer.style.borderRadius = "7.5px";
    newContainer.style.boxShadow = "0 10px 10px rgba(0, 0, 0, 0.3)";
    newContainer.style.willChange = "transform";
    newContainer.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
    newContainer.style.transform =
        "translateY(calc(-100% - 20px - " +
        applicationContainer.getBoundingClientRect().height +
        "px))";

    let newContent
    if (typeof message === "string") {
        let newSpan = document.createElement("span");
        newSpan.style.fontSize = "18px";
        newSpan.classList.add("SenFont", "NoSelect");
        newSpan.style.color = "white";
        newSpan.textContent = message;

        function close_callback() {
            if (applicationContainer.contains(newContainer) === true) {
                applicationContainer.removeChild(newContainer);
            }
            newContainer.remove();
            totalHeight = 0;
            for (const child of applicationContainer.children) {
                const cs = getComputedStyle(child);
                totalHeight +=
                    child.getBoundingClientRect().height +
                    (parseFloat(cs.marginTop) || 0) +
                    (parseFloat(cs.marginBottom) || 0);
            }
            applicationContainer.style.height = totalHeight + "px";
        }

        let newButton = document.createElement("img");
        newButton.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAv0lEQVR4nO2VXQrCMBAGxwtalZY86NkVLP6hN6hQCaQgJdXdsFHEDOQt+02TbBooFP6JBrgBB2ChqFsCJ+AK1FrpLBT2YXSAE9S5MHeo8xlqLk8BEvlY6sc5RbyKBE3JY9IuZCRRRwLvwGbUC7E561SpRJ5N+m4rpUdhvvJsK5XKs0qZONNYw31E2ueUu280V/Piykjuubl0wFxeGfwyfYaa1uCR2KeIjwbPos9QU4Uv3iq3zM/dhdp5irhQ+E0ekyummbane5EAAAAASUVORK5CYII="
        newButton.style.width = "20px"
        newButton.style.height = "20px"
        newButton.style.filter = "invert(1)"
        newButton.style.cursor = "pointer"
        newButton.draggable = false
        newButton.classList.add("NoSelect");
        newButton.onclick = close_callback

        newContent = document.createElement("div");
        newContent.style.width = "fit-content";
        newContent.style.height = "fit-content";
        newContent.style.gap = "5px";
        newContent.style.display = "flex"
        newContent.style.alignItems = "center"
        newContent.classList.add("PosHorizontally", "NoSelect");

        newContent.appendChild(newButton)
        newContent.appendChild(newSpan)
    } else {
        newContent = message
    }

    newContainer.appendChild(newContent);

    applicationContainer.prepend(newContainer);
    if (applicationContainer.childNodes.length > 6) {
        for (let i = applicationContainer.childNodes.length - 1; i > 5; i--) {
            applicationContainer.removeChild(applicationContainer.childNodes[i])
        }
    }

    for (const {el, top, transform} of previous) {
        const delta = top - el.getBoundingClientRect().top;
        if (!delta) continue;

        el.style.transition = "none";
        el.style.transform =
            transform === "none"
                ? `translateY(${delta}px)`
                : `translateY(${delta}px) ${transform}`;

        el.getBoundingClientRect();

        el.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
    }

    for (const child of applicationContainer.children) {
        const cs = getComputedStyle(child);
        totalHeight +=
            child.getBoundingClientRect().height +
            (parseFloat(cs.marginTop) || 0) +
            (parseFloat(cs.marginBottom) || 0);
    }
    applicationContainer.style.height = totalHeight + "px";

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            newContainer.style.transform = "translateY(0px)";
        });
    });

    async function callback() {
        await new Promise(resolve => setTimeout(resolve, time));
        newContainer.style.animation = "fade 1.25s linear";
        await new Promise(resolve => setTimeout(resolve, 1200));
        newContainer.style.opacity = "0";
        if (applicationContainer.contains(newContainer) === true) {
            applicationContainer.removeChild(newContainer);
        }
        newContainer.remove();
        totalHeight = 0;
        for (const child of applicationContainer.children) {
            const cs = getComputedStyle(child);
            totalHeight +=
                child.getBoundingClientRect().height +
                (parseFloat(cs.marginTop) || 0) +
                (parseFloat(cs.marginBottom) || 0);
        }
        applicationContainer.style.height = totalHeight + "px";
    }

    if (time !== -1) {
        callback()
    }
}

async function main() {
    await injectExtensions()
    const choiceContainer = document.getElementById("extension-choosing")
    let snippetContainer = document.getElementById("viewport-resize-container")
    for (const extension of Object.keys(EXTENSION_RESOURCE_HOLDER)) {

        let newOuterBox = document.createElement("div")
        newOuterBox.style.width = "calc(100% - 20px)"
        newOuterBox.style.height = "fit-content"
        newOuterBox.style.marginLeft = "10px"
        newOuterBox.classList.add("PosVertically", "NoSelect")
        newOuterBox.style.marginBottom = "5px"

        let newBox = document.createElement("div")
        newBox.id = "extension-choosing-" + extension
        newBox.style.display = "flex"
        newBox.style.alignItems = "center"
        newBox.style.gap = "5px"
        newBox.style.width = "100%"

        let newText = document.createElement("span")
        newText.textContent = extension
        newText.style.fontSize = "14px"
        newText.style.color = "white"
        newText.classList.add("GoogleCodeFont", "NoSelect")
        newText.style.padding = "0"
        newText.style.margin = "0"

        let callback = () => {
            if (document.getElementById("extension-choosing-checkbox-" + extension).checked === true) {
                enableExtension(extension)
                if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
                    let divider = document.getElementById("extension-divider-" + extension)
                    divider.style.flexGrow = "1"
                    document.getElementById("extension-snippets-" + extension).style.display = "block"
                }
            } else {
                disableExtension(extension)
                if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
                    let divider = document.getElementById("extension-divider-" + extension)
                    divider.style.flexGrow = "0"
                    divider.style.width = "0"
                    document.getElementById("extension-snippets-" + extension).style.display = "none"
                }
            }

            EXTENSION_RELATED_SNIPPETS[extension].forEach((critem) => {
                critem.classList.toggle("NOTSAFE")
                if (!document.body.contains(critem)) EXTENSION_RELATED_SNIPPETS[extension].splice(
                    EXTENSION_RELATED_SNIPPETS[extension].indexOf(critem), 1
                )
            })
        }

        let newCheckbox = document.createElement("input")
        newCheckbox.id = "extension-choosing-checkbox-" + extension
        newCheckbox.type = "checkbox"
        newCheckbox.classList.add("CustomCheckbox", "NoSelect")
        newCheckbox.onclick = callback

        newBox.appendChild(newCheckbox)
        newBox.appendChild(newText)

        let idfiedContainer

        if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
            let divider = document.createElement("div")
            divider.id = "extension-divider-" + extension
            divider.style.flexShrink = "0"
            divider.style.height = "3px"
            divider.style.backgroundImage = "linear-gradient(to left, #ff4400, #ff9900)"
            divider.style.transition = "all 0.25s"
            newBox.appendChild(divider)

            idfiedContainer = document.createElement("div")
            idfiedContainer.style.width = "fit-content"
            idfiedContainer.style.height = "fit-content"
            idfiedContainer.id = "extension-snippets-" + extension
            idfiedContainer.style.display = "none"
        }

        newOuterBox.appendChild(newBox)

        if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
            newOuterBox.appendChild(idfiedContainer)
        }

        EXTENSION_RELATED_SNIPPETS[extension] = []

        for (let snippet of Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"])) {
            let snippetCallback = () => {
                let needEditSwitch = false;
                if (window.IS_EDITING) {
                    window.switch_editing()
                    needEditSwitch = true;
                }

                let needSnapSwitch = false;
                if (window.IS_SNAPPING) {
                    window.switch_docking()
                    needSnapSwitch = true;
                }

                console.log(needEditSwitch, window.IS_EDITING)

                let newItem = document.createElement("div")
                newItem.innerHTML = EXTENSION_RESOURCE_HOLDER[extension]["snippets"][snippet]
                snippetContainer.appendChild(newItem.childNodes[0])
                if (snippetContainer.lastElementChild.classList.contains("DraggableDiv")) {
                    window.updateDraggable(snippetContainer.lastElementChild)
                }
                if (snippetContainer.lastElementChild.classList.contains("ResizeableDiv")) {
                    window.updateResizeable(snippetContainer.lastElementChild)
                }

                EXTENSION_RELATED_SNIPPETS[extension].push(snippetContainer.lastElementChild)

                let snapshot = idDupeObs.takeRecords()
                console.log(snapshot)
                for (const mutation of snapshot) {
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                let res = checkDupedId(node)
                                if (res) {
                                    notify("Cannot create this Element! Id already matches!")
                                    node.remove()
                                }
                            }
                        })
                    }
                }

                window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS.forEach(
                    (fn) => fn(snapshot)
                )

                if (needEditSwitch) {
                    window.switch_editing()
                }
                if (needSnapSwitch) {
                    window.switch_docking()
                }
            }

            let newSnippetContainer = document.createElement("div")
            newSnippetContainer.style.width = "fit-content"
            newSnippetContainer.style.height = "fit-content"
            newSnippetContainer.classList.add("PosHorizontally", "NoSelect")
            newSnippetContainer.style.cursor = "pointer"
            newSnippetContainer.style.marginLeft = "19px"
            newSnippetContainer.onclick = snippetCallback

            let newSnippetText = document.createElement("span")
            newSnippetText.textContent = snippet
            newSnippetText.style.fontSize = "14px"
            newSnippetText.style.color = "white"
            newSnippetText.classList.add("GoogleCodeFont", "NoSelect")
            newSnippetText.style.padding = "0"
            newSnippetText.style.margin = "0"
            newSnippetText.style.marginBottom = "3px"

            let newIcon = document.createElement("span")
            newIcon.style.color = "#ff9900"
            newIcon.style.fontSize = "14px"
            newIcon.classList.add("SenFont", "NoSelect")
            newIcon.textContent = "+"
            newIcon.style.marginRight = "5px"

            newSnippetContainer.appendChild(newIcon)
            newSnippetContainer.appendChild(newSnippetText)
            idfiedContainer.appendChild(newSnippetContainer)
        }

        choiceContainer.appendChild(newOuterBox)

    }

    await end_extra_load()
}

window.notify = notify

main()

function checkDupedId(item) {
    let check = (layer) => {
        if ([...layer.childNodes].length === 0) {
            const matched = document.querySelectorAll(`[id="${CSS.escape(layer.id)}"]`)
            return matched.length > 1;
        }
        return [...layer.childNodes].some((el) => {
            const matched = document.querySelectorAll(`[id="${CSS.escape(el.id)}"]`)
            return matched.length > 1 || check(el);
        })
    }
    return check(item)
}

const idDupeObs = new MutationObserver(() => {})
idDupeObs.observe(document.body, { childList: true, subtree: true })