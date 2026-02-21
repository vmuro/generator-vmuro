package <%= rootPackageName%>.common;

/**
 * Marker interface for queries.
 */
public interface Query {
}

/**
 * Interface for query handlers.
 * @param <T> the type of query
 * @param <U> the type of result
 */
interface QueryHandler<T extends Query, U> {
    U handleQuery(T query);
}
