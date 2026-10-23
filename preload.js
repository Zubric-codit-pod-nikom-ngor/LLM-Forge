const { contextBridge } = require("electron");
const {
    interactWithPythonPipeline,
    wipePythonPipeline,
    connectToPythonPipeline,
} = require("./static/python-pipeline");
const MD = require("marked")
const hljs = require("highlight.js");

MD.use({
    renderer: {
        code({ text, lang }) {
            const validLanguage = hljs.default.getLanguage(lang) ? lang : 'plaintext';
            const highlighted = hljs.default.highlight(text, { language: validLanguage }).value;
            return `<pre><code class="hljs lang-${validLanguage}">${highlighted}</code></pre>`;
        }
    }
});

contextBridge.exposeInMainWorld("pythonPipelineAPI", {
    interactWithPythonPipeline: (what) => interactWithPythonPipeline(what),
    wipePythonPipeline: () => wipePythonPipeline(),
    connectToPythonPipeline: () => {
        connectToPythonPipeline();
        return true;
    }
});

contextBridge.exposeInMainWorld("MD", {
    parse: MD.parse,
})