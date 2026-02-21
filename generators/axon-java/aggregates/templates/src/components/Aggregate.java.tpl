package <%= _rootPackageName%>.domain;

import org.axonframework.modelling.command.AggregateIdentifier;
import org.axonframework.spring.stereotype.Aggregate;
import org.axonframework.commandhandling.CommandHandler;
import org.axonframework.eventsourcing.EventSourcingHandler;
import org.axonframework.modelling.command.AggregateLifecycle;
import org.axonframework.modelling.command.AggregateCreationPolicy;
import org.axonframework.modelling.command.CreationPolicy;

<%-_typeImports%>
<%-_elementImports%>

@Aggregate
public class <%=_name%> {

    @AggregateIdentifier
    private <%-_idType%> <%-_idField%>;

    protected <%=_name%>() {
        // Required by Axon Framework
    }

<%-_commandHandlers%>

<%-_fields%>
}
