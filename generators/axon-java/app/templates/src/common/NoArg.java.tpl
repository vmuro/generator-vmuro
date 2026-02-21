package <%= rootPackageName%>.common;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marker annotation similar to Kotlin's no-arg plugin.
 * Can be used by annotation processors like Lombok to generate a no-argument constructor.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.CLASS)
public @interface NoArg {
}
