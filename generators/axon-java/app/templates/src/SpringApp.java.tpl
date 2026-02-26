package <%= rootPackageName%>;

import org.axonframework.commandhandling.CommandBus;
import org.axonframework.commandhandling.CommandMessage;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.axonframework.commandhandling.gateway.DefaultCommandGateway;
import org.axonframework.config.EventProcessingConfigurer;
import org.axonframework.eventhandling.PropagatingErrorHandler;
import org.axonframework.messaging.MessageDispatchInterceptor;
import org.axonframework.messaging.MessageHandlerInterceptor;
import org.axonframework.messaging.interceptors.BeanValidationInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.modulith.Modulith;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.List;

@Configuration
class ValidatorConfig {
    @Bean
    public LocalValidatorFactoryBean localValidatorFactoryBean() {
        return new LocalValidatorFactoryBean();
    }
}

@Configuration
class ValidationConfig {
    @Bean
    public BeanValidationInterceptor<?> beanValidationInterceptor(
            LocalValidatorFactoryBean validatorFactory
    ) {
        return new BeanValidationInterceptor<>(validatorFactory);
    }
}

@Configuration
class AxonConfig {

    @Autowired
    public void configurationEventHandling(EventProcessingConfigurer config) {
        config.registerDefaultListenerInvocationErrorHandler(c -> PropagatingErrorHandler.instance());
    }

    @Bean
    public CommandGateway commandGateway(
            CommandBus commandBus,
            List<MessageDispatchInterceptor<? super CommandMessage<?>>> dispatchInterceptors,
            List<MessageHandlerInterceptor<? super CommandMessage<?>>> handlerInterceptors
    ) {
        if (commandBus != null) {
            handlerInterceptors.forEach(commandBus::registerHandlerInterceptor);
        }
        return DefaultCommandGateway.builder()
                .commandBus(commandBus)
                .dispatchInterceptors(dispatchInterceptors)
                .build();
    }
}

@Modulith(
    systemName = "System",
    sharedModules = {"<%= rootPackageName%>.common", "<%= rootPackageName%>.domain"},
    useFullyQualifiedModuleNames = true
)
@EnableJpaRepositories
@SpringBootApplication
@EnableScheduling
@EntityScan(
    basePackages = {
        "<%= rootPackageName%>",
        "org.springframework.modulith.events.jpa",
        "org.axonframework.eventhandling.tokenstore",
        "org.axonframework.eventsourcing.eventstore.jpa",
        "org.axonframework.modelling.saga.repository.jpa",
        "org.axonframework.eventhandling.deadletter.jpa"
    }
)
public class SpringApp {
    public static void main(String[] args) {
        SpringApplication.run(SpringApp.class, args);
    }
}
