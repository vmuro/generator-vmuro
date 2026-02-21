package <%= _packageName%>.<%=_slice%>.internal;

import <%= _packageName%>.<%=_slice%>.<%=_name%>;
import org.springframework.stereotype.Component;
import <%= _packageName%>.<%=_slice%>.internal.<%=_name%>Repository;
import org.axonframework.queryhandling.QueryHandler;
import <%= _packageName%>.<%=_slice%>.<%= _name%>Query;
<%= _typeImports %>

/*
Boardlink: <%- link%>
*/
@Component
public class <%= _name%>QueryHandler {

  private final <%=_name%>Repository repository;

  public <%=_name%>QueryHandler(<%-_name%>Repository repository) {
    this.repository = repository;
  }

  @QueryHandler
  public <%=_name%> handleQuery(<%-_name%>Query query) {
      <%- _query%>
  }

}
