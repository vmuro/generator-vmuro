package <%= _packageName%>.<%=_slice%>;

import jakarta.persistence.Embeddable;
<%= _typeImports %>

@Embeddable
public record <%-_name%>Key(<%-_annotatedKeyFields%>) {}
