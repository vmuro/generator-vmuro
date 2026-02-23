## Nebulit GmbH - Eventmodeling Template (Java)

### Setup

Slices are defined as packages within the _root_ package (as specified in the generator).

### Next Steps after initial generation

TODOs are defined in the code for the places that need manual adjustments.
The generator makes certain basic assumptions (e.g., aggregateIds are UUIDs).

If these assumptions are deviated from, the code may not compile immediately and will need to be slightly adjusted.

Your code guidelines are sovereign, so it is expected that the code may need small adjustments to compile.

### Starting the Application

To start the service, you can use the _ApplicationStarter_ class in _src/test/java_.
Why in _test_?

This class starts the entire environment (including Postgres and, if necessary, Kafka via TestContainers).

### Package Structure

* **events**: Contains event definitions.
* **domain**: Contains aggregates.
* **slices**: Each slice has its own isolated package `<sliceName>`.
* **common**: Contains interfaces for the general structure.
