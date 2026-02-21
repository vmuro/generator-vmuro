package <%= _packageName%>.<%=_slice%>;

import <%= _rootPackageName%>.common.Event;
import <%= _rootPackageName%>.common.ReadModel;
import <%= _rootPackageName%>.common.Query;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

<%= _typeImports %>
<%= _eventsImports %>

/*
Boardlink: <%- link%>
*/
public record <%= _name%>Query(<%-idType%> <%-idAttribute%>) implements Query {}

/*
Boardlink: <%- link%>
*/
public class <%= _name%> implements ReadModel {

    private final Logger logger = LoggerFactory.getLogger(getClass());

<%- _fields%>

    public <%= _name%> applyEvents(java.util.List<Event> events) {
<%- _eventLoop %>
        return this;
    }

    // Public getters for fields (add as needed for each field in _fields)
    // Example:
    // public String getExampleField() {
    //     return exampleField;
    // }
}
