package <%= _packageName%>.<%=_slice%>.integration;

import <%= _rootPackageName%>.common.support.BaseIntegrationTest;
import <%= _rootPackageName%>.common.support.RandomData;
<%-_commandImports%>
<%-_queryImports%>
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.axonframework.queryhandling.QueryGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.assertj.core.api.Assertions;

import java.util.UUID;

/**
<%=_comment%>

Boardlink: <%- link%>
*/
public class <%=_name%> extends BaseIntegrationTest {

    @Autowired
    private CommandGateway commandGateway;

    @Autowired
    private QueryGateway queryGateway;

    @Test
    void <%=_testname%>() throws Exception {

        <%- _given %>

        <%- _then %>

    }

}
