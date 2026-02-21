/* (C)2024 */
package <%= rootPackageName%>.common.support;

import <%= rootPackageName%>.common.Event;
import org.axonframework.messaging.unitofwork.DefaultUnitOfWork;
import org.axonframework.modelling.command.Aggregate;
import org.axonframework.modelling.command.AggregateLifecycle;
import org.axonframework.modelling.command.AggregateNotFoundException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

public class ProjectionFixtureConfiguration<T> {
    private Supplier<Aggregate<T>> aggregateFactory;
    private final List<Event> given = new ArrayList<>();

    private ProjectionFixtureConfiguration<T> newInstance(Supplier<Aggregate<T>> factory) {
        this.aggregateFactory = factory;
        return this;
    }

    public void reset() {
        this.given.clear();
    }

    public void given(Event... events) {
        this.given.addAll(Arrays.asList(events));
    }

    public void apply() {
        DefaultUnitOfWork.startAndGet(null); // Assuming Axon 4.x
        Aggregate<T> aggregate;
        try {
            aggregate = aggregateFactory.get();
        } catch (AggregateNotFoundException e) {
            // Wait for 1 second and retry
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
            aggregate = aggregateFactory.get();
        }

        aggregate.execute(a -> given.forEach(AggregateLifecycle::apply));

        DefaultUnitOfWork.get().commit(); // Assuming Axon 4.x
    }

    public static <T> ProjectionFixtureConfiguration<T> aggregateInstance(Supplier<Aggregate<T>> factory) {
        ProjectionFixtureConfiguration<T> projectionFixtureConfiguration = new ProjectionFixtureConfiguration<>();
        projectionFixtureConfiguration.newInstance(factory);
        return projectionFixtureConfiguration;
    }
}
