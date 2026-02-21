package <%= _packageName%>.<%=_slice%>.internal;

import <%= _packageName%>.<%=_slice%>.<%- _readModel %>;
import <%= _packageName%>.<%=_slice%>.<%- _readModel %>Query;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.axonframework.queryhandling.QueryGateway;
import java.util.concurrent.CompletableFuture;
<%= _typeImports %>


/*
Boardlink: <%- link%>
*/
@RestController
public class <%= _controller%>Resource {

    private static final Logger logger = LoggerFactory.getLogger(<%- _controller%>Resource.class);
    private final QueryGateway queryGateway;

    public <%= _controller%>Resource(QueryGateway queryGateway) {
        this.queryGateway = queryGateway;
    }

    @CrossOrigin
    <%-_endpoint%>

}
