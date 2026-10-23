const { spawn } = require("child_process");
const path = require("path");
const readline = require("readline");


let pythonPipeline = null;
let stdoutReader = null;
let pendingRequests = [];

const isWin = process.platform === "win32";


function connectToPythonPipeline() {
    if (pythonPipeline) return pythonPipeline;

    const venvPath = path.join(__dirname, "..", ".venv", isWin ? "Scripts" : "bin", isWin ? "python.exe" : "python");
    const scriptPath = path.join(__dirname, "..", "backend_pipeline.py");
    console.log("connecting to pythonPipeline:", scriptPath);

    pythonPipeline = spawn(venvPath, [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"]
    });

    pythonPipeline.stderr.on("data", (data) => {
        console.error("[PYTHON STDERR]", data.toString());
    });

    pythonPipeline.on("exit", (code, signal) => {
        console.log(`[PYTHON] EXITED WITH ${code}, SIGNAL ${signal}`);

        const err = new Error(`[PYTHON] EXITED WITH ${code}, SIGNAL ${signal}`);
        while (pendingRequests.length) {
            pendingRequests.shift().reject(err);
        }

        if (stdoutReader) {
            stdoutReader.close();
            stdoutReader = null;
        }

        pythonPipeline = null;
    });

    stdoutReader = readline.createInterface({
        input: pythonPipeline.stdout,
    });

    stdoutReader.on("line", (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        let data;
        try {
            data = JSON.parse(trimmed);
        } catch (e) {
            console.warn("RECEIVED NON-JSON DATA", trimmed);
            return;
        }

        const request = pendingRequests.shift();
        if (request) {
            request.resolve(data);
        } else {
            console.warn("UNEXPECTED DATA:", data);
        }
    });

    return pythonPipeline;
}

function interactWithPythonPipeline(what) {
    return new Promise((resolve, reject) => {
        if (!pythonPipeline) {
            connectToPythonPipeline();
        }

        if (!pythonPipeline || !pythonPipeline.stdin.writable) {
            return reject(new Error("Python pipeline WAS NOT CONNECTED!"));
        }

        pendingRequests.push({ resolve, reject });

        const payload = JSON.stringify(what) + "\n";
        console.log("--> python interaction:", payload.trim());

        pythonPipeline.stdin.write(payload, (err) => {
            if (err) {
                const idx = pendingRequests.findIndex(
                    (p) => p.resolve === resolve && p.reject === reject
                );
                if (idx !== -1) pendingRequests.splice(idx, 1);
                reject(err);
            }
        });
    });
}

function wipePythonPipeline() {
    if (!pythonPipeline) return;

    try {
        const payload = JSON.stringify({
            object: "quit",
            args: [],
            kwargs: {},
        }) + "\n";

        pythonPipeline.stdin.write(payload);
    } catch (e) {
        console.error(e);
    } finally {
        pythonPipeline.stdin.end();

        setTimeout(() => {
            if (pythonPipeline) {
                pythonPipeline.kill();
                pythonPipeline = null;
            }
        }, 1000);
    }
}

module.exports = {
    connectToPythonPipeline,
    wipePythonPipeline,
    interactWithPythonPipeline,
};