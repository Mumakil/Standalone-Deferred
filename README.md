=Standalone Deferred

https://github.com/Mumakil/Standalone-Deferred

This is a standalone implementation of the [jQuery.Deferred](http://api.jquery.com/category/deferred-object/) interface. I wanted to use the wonderful Deferred interface in projects where I don't want to include the whole big jQuery library but use for example zepto. 

This project is trying to mimic $.Deferred as much as possible, but I wouldn't be surprised if there are differences. One major shortfall is that this one is missing all the `progress()` related stuff and `pipe()`.

==Compatibility

Requires Array.prototype.forEach.

==Tests

The project should have pretty complete test coverage written with [Jasmine](http://pivotal.github.com/jasmine/) but if you see any shortcomings, feel free to notify me.

==License

MIT License

==Author

Otto Vehviläinen