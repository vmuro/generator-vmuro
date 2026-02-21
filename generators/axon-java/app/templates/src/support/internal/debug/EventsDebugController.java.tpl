package <%= rootPackageName%>.support.internal.debug;

import org.axonframework.eventhandling.DomainEventMessage;
import org.axonframework.eventsourcing.eventstore.EventStorageEngine;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@ConditionalOnProperty(name = "application.debug.enabled", havingValue = "true")
@RestController
public class EventsDebugController {

    private final EventStorageEngine eventStorageEngine;

    public EventsDebugController(EventStorageEngine eventStorageEngine) {
        this.eventStorageEngine = eventStorageEngine;
    }

    @CrossOrigin
    @GetMapping("/internal/debug/events/{aggregateId}")
    public List<? extends DomainEventMessage<?>> resolveEvents(@PathVariable("aggregateId") String aggregateId) {
        return eventStorageEngine.readEvents(aggregateId).asStream().collect(Collectors.toList());
    }
}
