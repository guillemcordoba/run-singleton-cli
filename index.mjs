import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import exitHook from "exit-hook";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getProcessToRun() {
  const processToRun = process.argv[2];
  console.log(process.argv);

  if (!processToRun) throw new Error("You must indicate a process to run");
  return processToRun;
}

function runningFilePath() {
  return path.join(__dirname, ".running");
}

function runningFile() {
  if (!fs.existsSync(runningFilePath())) {
    fs.writeFileSync(runningFilePath(), "");
  }
  return fs.readFileSync(runningFilePath()).toString();
}

function getRunningProcesses() {
  const runningFileContents = runningFile();
  return runningFileContents.split("\n").filter((p) => !!p);
}

function setRunningProcesses(processes) {
  fs.writeFileSync(runningFilePath(), processes.join("\n"));
}

function addProcess(process) {
  const processes = getRunningProcesses();
  setRunningProcesses([...processes, process]);
}

function removeProcess(processToRemove) {
  const runningProcesses = getRunningProcesses();
  const newProcesses = runningProcesses.filter((p) => p !== processToRemove);
  if (newProcesses.length === 0) {
    fs.rmSync(runningFilePath());
  } else {
    setRunningProcesses(newProcesses);
  }
}

const processToRun = getProcessToRun();

if (!getRunningProcesses().includes(processToRun)) {
  // Process is already running in this foler, do nothing and exit

  addProcess(processToRun);
  exitHook(() => removeProcess(processToRun));
  try {
    // We have to instantiate process
    execSync(processToRun);
  } catch (e) {
    console.error(e);
  } finally {
    removeProcess(processToRun);
  }
} else {
  console.log("Singleton process already running, skipping");
}
