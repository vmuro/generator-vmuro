package <%= _packageName%>.<%=_slice%>;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import org.hibernate.annotations.JdbcTypeCode;
import java.sql.Types;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
<%= _typeImports %>

/*
Boardlink: <%- link%>
*/
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class <%-_name%>Entity {
	<%- _entityFields %>
}
