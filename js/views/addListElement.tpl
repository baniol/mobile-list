<h1><%= form_title %></h1>
<form class="std-edit-form margin-medium">

	<div class="form-group">
		<input type="text" name="item-name" value="<%= name %>" />
	</div>

	<div class="form-group submit">
		<span class="icon icon-ok-sign" id="add-submit"></span>
	</div>
</form>

<% if(del != null){ %>

<h1>Delete <%= del %></h1>
	<div class="form-group">
		<span class="std-button error icon icon-remove-sign"></span>
	</div>
<% } %>