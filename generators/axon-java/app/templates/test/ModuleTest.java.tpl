package <%= rootPackageName%>;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

public class ModuleTest {

    @Test
    void verifyModules() {
        ApplicationModules.of(SpringApp.class).verify();
    }
}
