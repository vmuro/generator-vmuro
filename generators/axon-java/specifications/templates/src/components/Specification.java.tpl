package <%= _packageName%>.<%=_slice%>;

import <%= _rootPackageName%>.common.Event;
import <%= _rootPackageName%>.common.support.RandomData;
import <%= _rootPackageName%>.domain.<%=_aggregate%>;
import <%= _rootPackageName%>.common.CommandException;
import org.axonframework.test.aggregate.AggregateTestFixture;
import org.axonframework.test.aggregate.FixtureConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
<%= _elementImports%>
<%= _typeImports%>

/**
<%=_comment%>

Boardlink: <%- link%>
*/
public class <%=_name%> {

    private FixtureConfiguration<<%=_aggregate%>> fixture;

    @BeforeEach
    public void setUp() {
        fixture = new AggregateTestFixture<>(<%=_aggregate%>.class);
    }

    @Test
    public void `<%=_testname%>`() throws Exception {

      <%-_idAttribute%>

      //GIVEN
      final List<Event> events = new ArrayList<>();
      <%- _given%>

      //WHEN
      <%- _when %>

      //THEN
      final List<Event> expectedEvents = new ArrayList<>();
      <%- _thenExpectations %>

      fixture.given(events)
        .`when`(command)
        <%- _then %>
    }

}
