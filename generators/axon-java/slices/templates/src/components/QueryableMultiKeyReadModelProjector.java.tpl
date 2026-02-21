package <%= _packageName%>.<%=_slice%>.internal;

import org.axonframework.eventhandling.EventHandler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

<%= _typeImports %>
<%= _eventsImports %>
import <%= _packageName%>.<%=_slice%>.<%= _name%>Entity;
import <%= _packageName%>.<%=_slice%>.<%= _name%>Key;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public interface <%-_name%>Repository extends JpaRepository<<%-_name%>Entity, <%-_name%>Key> {}

<%- _aiComment %>
/*
Boardlink: <%- link%>
*/
@Component
public class <%-_name%>Projector {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final <%-_name%>Repository repository;

    public <%-_name%>Projector(<%-_name%>Repository repository) {
        this.repository = repository;
    }

    <%- _eventHandlers %>

}
