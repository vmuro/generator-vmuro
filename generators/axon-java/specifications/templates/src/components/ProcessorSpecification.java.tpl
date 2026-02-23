package <%= _packageName%>.<%=_slice%>.integration;

import <%= _rootPackageName%>.common.support.BaseIntegrationTest;
import <%= _rootPackageName%>.common.support.RandomData;
import <%= _rootPackageName%>.common.support.StreamAssertions;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.assertj.core.api.Assertions;

import java.util.UUID;
<%-_commandImports%>
<%= _elementImports%>

/**
<%=_comment%>

Boardlink: <%- link%>
*/
public class <%=_name%> extends BaseIntegrationTest {

    @Autowired
    private CommandGateway commandGateway;

    @Autowired
    private StreamAssertions streamAssertions;

    @Test
    void <%=_testname%>() throws Exception {

        <%- _given %>

        <%- _then %>

    }

}
