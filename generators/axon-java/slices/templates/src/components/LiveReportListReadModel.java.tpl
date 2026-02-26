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
public class <%= _name%> implements ReadModel {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final java.util.List<Item> data = new java.util.ArrayList<>();

    public java.util.List<Item> getData() {
        return data;
    }

    public <%= _name%> applyEvents(java.util.List<Event> events) {
<%- _eventLoop %>
        return this;
    }

    public record Item(<%- _fields%>) {}
}
