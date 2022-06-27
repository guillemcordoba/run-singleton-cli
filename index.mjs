#!/usr/bin/env node

import { exec } from "node:child_process";
import fs from "node:fs";
import path, { resolve } from "node:path";
import exitHook from "exit-hook";
import ps from "ps-node";
import lockfile from "proper-lockfile";

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
    fs.writeFileSync(runningFilePath(), "{}");
  }
  return fs.readFileSync(runningFilePath()).toString();
}

function getRunningProcesses() {
  const runningFileContents = runningFile();
  try {
    return JSON.parse(runningFileContents);
  } catch (e) {
    return {};
  }
}

function setRunningProcesses(processes) {
  fs.writeFileSync(runningFilePath(), JSON.stringify(processes));
}

function addProcess(process, pid) {
  const processes = getRunningProcesses();

  processes[process] = pid;

  setRunningProcesses(processes);
}

function removeProcess(processToRemove) {
  const runningProcesses = getRunningProcesses();

  delete runningProcesses[processToRemove];

  setRunningProcesses(runningProcesses);
}

async function cleanUp() {
  return new Promise((resolve) => {
    // A simple pid lookup
    ps.lookup({}, (err, list) => {
      if (err) return;

      const allPids = list.map((p) => p.pid);

      const actualRunningProcesses = {};
      const runningProcesses = getRunningProcesses();

      for (const [runningProcess, pid] of Object.entries(runningProcesses)) {
        if (allPids.includes(pid.toString())) {
          actualRunningProcesses[runningProcess] = pid;
        }
      }

      setRunningProcesses(actualRunningProcesses);
      resolve();
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(() => r(), ms));

async function runSingleton() {
  let release;

  while (!release) {
    try {
      release = lockfile.lockSync(runningFilePath());
    } catch (e) {
      await sleep(1);
    }
  }

  await cleanUp();

  const processToRun = getProcessToRun();

  if (!Object.keys(getRunningProcesses()).includes(processToRun)) {
    process.on("SIGINT", function () {
      removeProcess(processToRun);
    });
    exitHook(() => {
      removeProcess(processToRun);
    });

    // We have to instantiate process
    const subprocess = exec(processToRun);
    addProcess(processToRun, subprocess.pid);

    subprocess.stdout.pipe(process.stdout);
    subprocess.stderr.pipe(process.stderr);

    subprocess.on("exit", function (code) {
      removeProcess(processToRun);
    });
  } else {
    // Process is already running in this foler, do nothing and exit
    console.log("Singleton process already running, skipping");
  }

  release();
}

runSingleton();
