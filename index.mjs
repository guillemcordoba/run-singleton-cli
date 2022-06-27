#!/usr/bin/env node

import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node;path";
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
  addProcess(processToRun);
  process.on('SIGINT', function() {
    removeProcess(processToRun);
  })
  exitHook(() => {
    removeProcess(processToRun);
  });

  // We have to instantiate process
  const subprocess = exec(processToRun);

  subprocess.stdout.pipe(process.stdout);
  subprocess.stderr.pipe(process.stderr);
  
  subprocess.on("exit", function (code) {
    removeProcess(processToRun);
  });
} else {
  // Process is already running in this foler, do nothing and exit
  console.log("Singleton process already running, skipping");
}
