#!/usr/bin/env bash
":"; //# comment; exec /usr/bin/env node --input-type=module - "$@" < "$0"
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import exitHook from "exit-hook";

function getProcessToRun() {
  const processToRun = process.argv[2];

  if (!processToRun) throw new Error("You must indicate a process to run");
  return processToRun;
}

function runningFilePath() {
  return path.join(process.cwd(), ".running");
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
  // We have to instantiate process
  const subprocess = exec(processToRun);
  subprocess.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  subprocess.stderr.on("data", function (data) {
    console.error(data.toString());
  });

  subprocess.on("exit", function (code) {
    removeProcess(processToRun);
  });
} else {
  console.log("Singleton process already running, skipping");
}
