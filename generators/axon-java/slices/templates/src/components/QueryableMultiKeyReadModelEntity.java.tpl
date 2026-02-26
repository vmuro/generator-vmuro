package <%= _packageName%>.<%=_slice%>;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import org.hibernate.annotations.JdbcTypeCode;
import java.sql.Types;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
<%= _typeImports %>

@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(<%-_name%>Key.class)
@Entity
public class <%-_name%>Entity {
	<%- _entityFields %>
}
