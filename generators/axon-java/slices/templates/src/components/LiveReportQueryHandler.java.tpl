package <%= _packageName%>.<%=_slice%>.internal;

import <%= _rootPackageName%>.common.QueryHandler;
import <%= _rootPackageName%>.common.Event;
import org.springframework.stereotype.Component;
import <%= _packageName%>.<%=_slice%>.<%= _name%>;
import <%= _packageName%>.<%=_slice%>.<%= _name%>Query;
<%= _typeImports %>
import org.axonframework.eventsourcing.eventstore.EventStore;
import java.util.List;
import java.util.stream.Collectors;


/*
Boardlink: <%- link%>
*/
@Component
public class <%= _name%>QueryHandler implements QueryHandler<<%= _name%>Query, <%= _name%>> {

    private final EventStore eventStore;

    public <%= _name%>QueryHandler(EventStore eventStore) {
        this.eventStore = eventStore;
    }

    @org.axonframework.queryhandling.QueryHandler
    @Override
    public <%= _name%> handleQuery(<%= _name%>Query query) {
           List<Event> events =
                   eventStore
                       .readEvents(query.<%-idAttribute%>().toString())
                       .asStream()
                       .filter(eventMessage -> eventMessage.getPayload() instanceof Event)
                       .map(eventMessage -> (Event) eventMessage.getPayload())
                       .collect(Collectors.toList());

               return new <%= _name%>().applyEvents(events);
        }
}
