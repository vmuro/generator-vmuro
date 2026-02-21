# Axon Java Generator

This is a Yeoman generator for creating Axon Framework applications with Spring Boot and Spring Modulith, using Java. It generates a project structure similar to the Kotlin Axon generator, but with Java as the primary language.

## Getting Started

To use this generator, you need to have Yeoman installed globally:

```bash
npm install -g yo
```

Additionally, since this generator is developed locally within the `nebulit-code-generators` project, you need to link it globally for Yeoman to discover it. Navigate to the `gen-code/nebulit-code-generators` directory and run `npm link`:

```bash
cd gen-code/nebulit-code-generators
npm link
```

## How to Use

1.  **Navigate to your project directory:**
    ```bash
    cd my-axon-java-project
    ```

2.  **Run the generator:**
    ```bash
    yo axon-java
    ```

3.  **Answer the prompts:** The generator will ask you a series of questions, similar to the original Axon Kotlin generator:
    *   **Project Name**: The name of your application.
    *   **Root Package**: The base package name for your application (e.g., `com.example.myapp`).
    *   **What should be generated?**: Choose from:
        *   `Skeleton`: Generates the basic Spring Boot/Axon project structure.
        *   `Slices`: Generates commands, events, read models, and REST controllers for defined slices.
        *   `Aggregates`: Generates Axon aggregates.
    *   **For `Slices` and `Aggregates` generation, you will be prompted for further selections based on your `config.json` file.**

## Configuration

This generator relies on a `config.json` file in the root of your project, which is typically generated from a Miro board or similar modeling tool. This file defines your domain, slices, commands, events, read models, and specifications.

A typical `config.json` structure looks like this (simplified):

```json
{
  "boardId": "your-miro-board-id",
  "codeGen": {
    "application": "my-app",
    "rootPackage": "com.example.myapp"
  },
  "slices": [
    {
      "id": "slice-id-1",
      "title": "Customer",
      "context": "CustomerManagement",
      "commands": [...],
      "events": [...],
      "readmodels": [...],
      "processors": [...],
      "specifications": [...]
    }
  ],
  "aggregates": [
    {
      "id": "aggregate-id-1",
      "title": "CustomerAggregate",
      "fields": [...]
    }
  ]
}
```

Ensure your `config.json` is correctly structured and available in the project root before running the generator for `Slices` or `Aggregates`.

## Generated Code Structure

The generator creates a standard Maven-based Spring Boot project with Axon Framework and Spring Modulith.

```
.
├── .mvn/
├── src/main/java/                     # Main Java source code
│   └── com/example/myapp/
│       ├── common/                    # Common interfaces (Command, Event, Query, etc.)
│       ├── domain/                    # Axon Aggregates
│       ├── events/                    # Domain Events
│       ├── <slice-name>/              # Slice-specific components (Read Models, Processors, REST)
│       └── SpringApp.java             # Main Spring Boot application class
├── src/main/resources/
│   ├── application.yml                # Spring Boot configuration
│   └── db/migration/                  # Flyway database migrations
├── src/test/java/                     # Test Java source code
│   └── com/example/myapp/
│       ├── common/support/            # Test support classes (BaseIntegrationTest, RandomData, StreamAssertions)
│       ├── <slice-name>/              # Slice-specific tests (Specifications)
│       ├── ApplicationStarter.java    # Test application starter with Testcontainers
│       └── ModuleTest.java            # Spring Modulith module tests
├── pom.xml                            # Maven Project Object Model
├── mvnw                               # Maven wrapper script (Linux/macOS)
└── mvnw.cmd                           # Maven wrapper script (Windows)
```

## Key Features

*   **Java 21 Ready**: Generates code compatible with Java 21.
*   **Spring Boot 3.x**: Leverages the latest Spring Boot features.
*   **Axon Framework**: Integrated with Axon Framework for Event Sourcing and CQRS.
*   **Spring Modulith**: Supports modular application development using Spring Modulith.
*   **Testcontainers**: Includes setup for integration tests with Testcontainers for PostgreSQL.
*   **Yeoman-based**: Provides an interactive command-line interface for code generation.

## Contributing

For any issues or feature requests, please open an issue on the project's GitHub repository.
