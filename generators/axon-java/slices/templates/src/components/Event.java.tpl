package <%= _packageName%>.events;

import <%= _rootPackageName%>.common.Event;

<%= _typeImports %>

/*
Boardlink: <%- link%>
*/
public record <%=_name%>(
    <%- _fields%>
) implements Event {
}
