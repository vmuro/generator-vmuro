package <%= rootPackageName%>.common.support;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(
    properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=true",
    }
)
@Disabled
public class DbLogTest extends BaseIntegrationTest {

    @Test
    void logSqlStatements() {
        // no-op - just logs sql
    }
}
