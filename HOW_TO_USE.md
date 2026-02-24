# How to Use the Axon Java Code Generator

This document provides a step-by-step guide on how to use the Axon Java Code Generator, which helps automate the creation of Axon Framework and Spring Modulith-based Java code from your Event Modeling definitions (typically exported from Miro).

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Prerequisites](#2-prerequisites)
3.  [Installation](#3-installation)
4.  [Usage Workflow](#4-usage-workflow)
    *   [Step 1: Generate the Project Skeleton](#step-1-generate-the-project-skeleton)
    *   [Step 2: Obtain your config.json](#step-2-obtain-your-configjson)
    *   [Step 3: Generate Slices, Aggregates, or Specifications](#step-3-generate-slices-aggregates-or-specifications)
5.  [Expected config.json Structure](#5-expected-configjson-structure)
6.  [Running the Generated Project](#6-running-the-generated-project)
7.  [Troubleshooting Common Issues](#7-troubleshooting-common-issues)
    *   [Error: Cannot find module '.../config.json'](#error-cannot-find-module-configjson)
    *   [Error: No selectable choices. All choices are disabled.](#error-no-selectable-choices-all-choices-are-disabled)
    *   [Files generated with .tpl extension](#files-generated-with-tpl-extension)
    *   [ReferenceError: [functionName] is not defined](#referenceerror-functionname-is-not-defined)

---

## 1. Introduction

This Yeoman generator (`generator-vmuro`) is designed to rapidly scaffold Axon Framework-based Java applications following a modular, event-driven architecture, integrated with Spring Modulith. It takes an Event Model definition (exported as `config.json`) and generates boilerplate code for:

*   Aggregates (Axon)
*   Commands and Events (Java Records)
*   Read Models and Projectors (JPA Entities, Axon Query Handlers)
*   REST Controllers for commands and queries
*   Integration Tests
*   Spring Boot application structure with Maven

## 2. Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (LTS version recommended)
*   **npm** (Node Package Manager, usually comes with Node.js)
*   **Yeoman CLI**: Install globally using npm:
    ```bash
    npm install -g yo
    ```

## 3. Installation

To use this generator, you need to install it globally via npm:

1.  Navigate to the root directory of the `generator-vmuro` project:
    

2.  Link the generator globally:
    ```bash
    npm link
    ```
    This makes the `vmuro` generator available to Yeoman from any directory.

## 4. Usage Workflow

The generation process involves a few steps to ensure your project is set up correctly.

### Step 1: Generate the Project Skeleton

This step creates the basic Maven project structure, including `pom.xml`, Spring Boot application files, common utilities, and test infrastructure.

1.  **Create a new, empty directory** for your project and navigate into it:
    ```bash
    mkdir my-new-axon-app
    cd my-new-axon-app
    ```
2.  Run the generator and select the `Skeleton` option:
    ```bash
    yo vmuro
    ```
    *   Choose `axon-java`.
    *   Enter your `Projectame` (e.g., `my-new-axon-app`).
    *   Enter your `Root Package` (e.g., `com.example`).
    *   Select `Skeleton (Use this for new projects)`.

    This will generate your base project files (including `pom.xml`, `SpringApp.java`, etc.).

### Step 2: Obtain your config.json

Your code will be generated based on an Event Model. This generator expects the model definition in a file named `config.json`.

1.  **Export your Event Model** from your tool (e.g., Miro) as a JSON file.
2.  **Rename this file to `config.json`**.
3.  **Place `config.json` in the root directory of your newly generated project** (`my-new-axon-app/config.json`).

### Step 3: Generate Slices, Aggregates, or Specifications

Once you have your project skeleton and `config.json` in place, you can generate the domain-specific code.

1.  **Navigate to the root directory of your project** (where `pom.xml` and `config.json` are located):
    ```bash
    cd my-new-axon-app
    ```
2.  Run the generator again:
    ```bash
    yo vmuro
    ```
    *   Choose `axon-java`.
    *   The `Projectame` and `Root Package` will be pre-filled from your `config.json` or you'll be prompted if they are missing.
    *   You will now see `Slices` and `Aggregates` options enabled, showing the number of items found in your `config.json`.
    *   Select either `Slices` or `Aggregates` to generate the corresponding code. The generator will then prompt you to choose which specific slices or aggregates to generate.

    Repeat this step as needed to generate all desired slices, aggregates, and their specifications.

## 5. Expected config.json Structure

The `config.json` file is expected to contain a JSON object with at least `slices` and `aggregates` arrays at its root, structured as exported by your Event Modeling tool. Example snippet:

```json
{
  "slices": [
    {
      "id": "...",
      "title": "slice: My Feature",
      "commands": [...],
      "events": [...],
      "readmodels": [...],
      "aggregates": ["MyAggregate"]
    }
  ],
  "aggregates": [
    {
      "id": "...",
      "title": "MyAggregate",
      "fields": [...]
    }
  ],
  "codeGen": {
    "application": "my-new-axon-app",
    "rootPackage": "com.example"
  }
}
```

## 6. Running the Generated Project

After generating your code:

1.  You can build the Maven project:
    ```bash
    ./mvnw clean install
    ```
    (On Windows, use `mvnw.cmd clean install`)
2.  Run the Spring Boot application (using the `ApplicationStarter` in test scope, as explained in the generated `README.md`):
    ```bash
    ./mvnw spring-boot:run
    ```
    (Or `mvnw.cmd spring-boot:run` on Windows)

## 7. Troubleshooting Common Issues

### Error: Cannot find module '.../config.json'

This error occurs if the `config.json` file is not present in the directory where you are running `yo vmuro`, and you selected an option that requires it (Slices or Aggregates).

**Solution:**
1.  Ensure you have generated the project skeleton first (Step 1).
2.  Export your Event Model as `config.json` and place it in the root of your project directory (Step 2).
3.  Run `yo vmuro` again from the project root.

### Error: No selectable choices. All choices are disabled.

This happens if the `config.json` is present but the `slices` or `aggregates` arrays within it are empty or malformed.

**Solution:**
1.  Verify the content of your `config.json`. Ensure it has a `slices` array and an `aggregates` array, and that these arrays contain definitions for your domain elements.
2.  If the arrays are empty, your Event Model might not have defined any slices or aggregates yet.

### Files generated with .tpl extension

If your generated files (e.g., `pom.xml.tpl`, `SpringApp.java.tpl`) still have the `.tpl` extension, this indicates an issue with the generator's file processing.

**Solution:** This issue has been addressed in recent updates. Please ensure your `generator-vmuro` is up-to-date by running `npm link` in its root directory after pulling the latest changes. If the issue persists, please report it.

### ReferenceError: [functionName] is not defined

This usually indicates a missing import in one of the generator's JavaScript files.

**Solution:** This type of error is generally fixed during generator development. Please ensure your `generator-vmuro` is up-to-date by running `npm link` in its root directory. If the issue persists, please report it.
