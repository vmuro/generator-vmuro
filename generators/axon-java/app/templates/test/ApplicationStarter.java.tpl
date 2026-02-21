package <%= rootPackageName%>;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

public class ApplicationStarter {

    public static void main(String[] args) {
        SpringApplication.from(SpringApp::main)
                .with(ContainerConfiguration.class)
                .run(args);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class ContainerConfiguration {

        private static final int POSTGRES_PORT = 5432;

        @Bean
        @ServiceConnection
        public PostgreSQLContainer<?> postgresContainer() {
            return new PostgreSQLContainer<>(DockerImageName.parse("postgres"))
                    .withReuse(true)
                    .withExposedPorts(POSTGRES_PORT)
                    .withPassword("postgres")
                    .withUsername("postgres");
        }
    }
}
