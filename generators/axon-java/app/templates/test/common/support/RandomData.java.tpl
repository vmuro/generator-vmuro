package <%= rootPackageName%>.common.support;

import org.jeasy.random.EasyRandom;
import org.jeasy.random.EasyRandomParameters;
import org.jeasy.random.FieldPredicates;
import org.jeasy.random.randomizers.number.BigDecimalRandomizer;
import org.jeasy.random.randomizers.text.StringRandomizer;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.ByteBuffer;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

public class RandomData {

    private RandomData() {
        // Private constructor to prevent instantiation
    }

    public static <T> T newInstance(
            Class<T> type,
            List<String> fieldsToIgnore,
            Consumer<T> block
    ) {
        EasyRandomParameters parameters = new EasyRandomParameters()
                .collectionSizeRange(1, 4)
                .randomize(UUID.class, UUID::randomUUID)
                .randomize(BigDecimal.class, new BigDecimalRandomizer(2, RoundingMode.CEILING))
                .randomize(CharSequence.class, () -> new StringBuilder(new StringRandomizer().getRandomValue()))
                .randomize(ByteBuffer.class, () -> ByteBuffer.wrap(new StringRandomizer().getRandomValue().getBytes()));

        fieldsToIgnore.forEach(fieldName -> parameters.excludeField(FieldPredicates.named(fieldName)));

        EasyRandom generator = new EasyRandom(parameters);

        T instance = generator.nextObject(type);
        if (block != null) {
            block.accept(instance);
        }
        return instance;
    }

    public static <T> T newInstance(Class<T> type) {
        return newInstance(type, Collections.emptyList(), null);
    }

    public static <T> T newInstance(Class<T> type, List<String> fieldsToIgnore) {
        return newInstance(type, fieldsToIgnore, null);
    }

    public static <T> T newInstance(Class<T> type, Consumer<T> block) {
        return newInstance(type, Collections.emptyList(), block);
    }
}
