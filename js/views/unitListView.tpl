<ul class="main-list unit-list">
	<% for(var i=0;i<obj.length;i++){ %>

	<li data-id="0">
		<a>
			<span><%= obj.item(i).src_lang %></span>
			<span><%= obj.item(i).target_lang %></span>
		</a>
	</li>

	<%}%>
</ul>