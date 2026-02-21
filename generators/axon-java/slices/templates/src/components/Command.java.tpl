package <%= _packageName%>.domain.commands.<%=_slice%>;

import org.axonframework.modelling.command.TargetAggregateIdentifier;
import <%= _rootPackageName%>.common.Command;
<%= _typeImports %>

/*
Boardlink: <%- link%>
*/
public record <%=_name%>(
    <%- _fields%>
) implements Command {
}
