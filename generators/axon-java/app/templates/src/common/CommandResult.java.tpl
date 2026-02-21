package <%= rootPackageName%>.common;

import java.util.UUID;

/**
 * Result of a command execution that allows
 * to give Feedback to the client to update.
 */
public record CommandResult(
    UUID identifier,
    long aggregateSequence
) {}
