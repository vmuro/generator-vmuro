package <%= _packageName%>.<%=_slice%>.internal;

import <%= _packageName%>.<%=_readModelSlice%>.<%- _readModel %>;
import <%= _packageName%>.<%=_readModelSlice%>.<%- _readModel %>Query;
import <%= _rootPackageName%>.common.Processor;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.axonframework.queryhandling.QueryGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.axonframework.eventhandling.EventHandler;
import <%= _packageName%>.domain.commands.<%=_slice%>.<%- _command%>;
<%-_typeImports%>
<%= _eventsImports %>

/*
Boardlink: <%- link%>
*/
@Component
public class <%= _name%> implements Processor {

   private static final Logger logger = LoggerFactory.getLogger(<%- _name%>.class);

   private CommandGateway commandGateway;
   private QueryGateway queryGateway;

    @Autowired
    public void setCommandGateway(CommandGateway commandGateway) {
        this.commandGateway = commandGateway;
    }

    @Autowired
    public void setQueryGateway(QueryGateway queryGateway) {
        this.queryGateway = queryGateway;
    }

<%- _triggers%>

}
