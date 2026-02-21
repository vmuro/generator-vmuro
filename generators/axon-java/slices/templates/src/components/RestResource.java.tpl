package <%= _packageName%>.<%=_slice%>.internal;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.axonframework.commandhandling.gateway.CommandGateway;
import <%= _packageName%>.domain.commands.<%=_slice%>.<%- _command%>;

<%= _typeImports %>
import java.util.concurrent.CompletableFuture;


<%-_payload%>

/*
Boardlink: <%- link%>
*/
@RestController
public class <%= _controller%> {

    private static final Logger logger = LoggerFactory.getLogger(<%- _controller%>.class);
    private final CommandGateway commandGateway;

    public <%= _controller%>(CommandGateway commandGateway) {
        this.commandGateway = commandGateway;
    }

    <%-_debugendpoint%>

    <%-_endpoint%>

}
