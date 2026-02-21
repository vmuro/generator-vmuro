package <%= rootPackageName%>.common.support;

import org.assertj.core.api.Assertions;
import org.axonframework.eventsourcing.eventstore.EventStore;
import org.springframework.stereotype.Component;

import java.util.function.Predicate;
import java.util.stream.Collectors;

@Component
public class StreamAssertions {

    private final EventStore eventStore;

    public StreamAssertions(EventStore eventStore) {
        this.eventStore = eventStore;
    }

    public void assertEvent(String aggregateId, Predicate<Object> predicate) {
        Assertions.assertThat(
            eventStore.readEvents(aggregateId).asStream()
                .map(eventMessage -> eventMessage.getPayload())
                .collect(Collectors.toList())
        ).anyMatch(predicate);
    }
}
