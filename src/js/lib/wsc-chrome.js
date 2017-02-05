// UNDERSCORE.JS START //
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate, context) {
    predicate = lookupIterator(predicate);
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate.call(context, elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);
// UNDERSCORE.JS END //

// ENCODING.JS START //

// Copyright 2014 Joshua Bell. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// If we're in node require encoding-indexes and attach it to the global.
/**
 * @fileoverview Global |this| required for resolving indexes in node.
 * @suppress {globalThis}
 */
if (typeof module !== "undefined" && module.exports) {
  this["encoding-indexes"] =
    require("./encoding-indexes.js")["encoding-indexes"];
}

(function(global) {
  'use strict';

  //
  // Utilities
  //

  /**
   * @param {number} a The number to test.
   * @param {number} min The minimum value in the range, inclusive.
   * @param {number} max The maximum value in the range, inclusive.
   * @return {boolean} True if a >= min and a <= max.
   */
  function inRange(a, min, max) {
    return min <= a && a <= max;
  }

  /**
   * @param {number} n The numerator.
   * @param {number} d The denominator.
   * @return {number} The result of the integer division of n by d.
   */
  function div(n, d) {
    return Math.floor(n / d);
  }

  /**
   * @param {*} o
   * @return {Object}
   */
  function ToDictionary(o) {
    if (o === undefined) return {};
    if (o === Object(o)) return o;
    throw TypeError('Could not convert argument to dictionary');
  }

  /**
   * @param {string} string Input string of UTF-16 code units.
   * @return {!Array.<number>} Code points.
   */
  function stringToCodePoints(string) {
    // http://heycam.github.io/webidl/#dfn-obtain-unicode

    // 1. Let S be the DOMString value.
    var s = String(string);

    // 2. Let n be the length of S.
    var n = s.length;

    // 3. Initialize i to 0.
    var i = 0;

    // 4. Initialize U to be an empty sequence of Unicode characters.
    var u = [];

    // 5. While i < n:
    while (i < n) {

      // 1. Let c be the code unit in S at index i.
      var c = s.charCodeAt(i);

      // 2. Depending on the value of c:

      // c < 0xD800 or c > 0xDFFF
      if (c < 0xD800 || c > 0xDFFF) {
        // Append to U the Unicode character with code point c.
        u.push(c);
      }

      // 0xDC00 ≤ c ≤ 0xDFFF
      else if (0xDC00 <= c && c <= 0xDFFF) {
        // Append to U a U+FFFD REPLACEMENT CHARACTER.
        u.push(0xFFFD);
      }

      // 0xD800 ≤ c ≤ 0xDBFF
      else if (0xD800 <= c && c <= 0xDBFF) {
        // 1. If i = n−1, then append to U a U+FFFD REPLACEMENT
        // CHARACTER.
        if (i === n - 1) {
          u.push(0xFFFD);
        }
        // 2. Otherwise, i < n−1:
        else {
          // 1. Let d be the code unit in S at index i+1.
          var d = string.charCodeAt(i + 1);

          // 2. If 0xDC00 ≤ d ≤ 0xDFFF, then:
          if (0xDC00 <= d && d <= 0xDFFF) {
            // 1. Let a be c & 0x3FF.
            var a = c & 0x3FF;

            // 2. Let b be d & 0x3FF.
            var b = d & 0x3FF;

            // 3. Append to U the Unicode character with code point
            // 2^16+2^10*a+b.
            u.push(0x10000 + (a << 10) + b);

            // 4. Set i to i+1.
            i += 1;
          }

          // 3. Otherwise, d < 0xDC00 or d > 0xDFFF. Append to U a
          // U+FFFD REPLACEMENT CHARACTER.
          else  {
            u.push(0xFFFD);
          }
        }
      }

      // 3. Set i to i+1.
      i += 1;
    }

    // 6. Return U.
    return u;
  }

  /**
   * @param {!Array.<number>} code_points Array of code points.
   * @return {string} string String of UTF-16 code units.
   */
  function codePointsToString(code_points) {
    var s = '';
    for (var i = 0; i < code_points.length; ++i) {
      var cp = code_points[i];
      if (cp <= 0xFFFF) {
        s += String.fromCharCode(cp);
      } else {
        cp -= 0x10000;
        s += String.fromCharCode((cp >> 10) + 0xD800,
                                 (cp & 0x3FF) + 0xDC00);
      }
    }
    return s;
  }


  //
  // Implementation of Encoding specification
  // http://dvcs.w3.org/hg/encoding/raw-file/tip/Overview.html
  //

  //
  // 3. Terminology
  //

  /**
   * End-of-stream is a special token that signifies no more tokens
   * are in the stream.
   * @const
   */ var end_of_stream = -1;

  /**
   * A stream represents an ordered sequence of tokens.
   *
   * @constructor
   * @param {!(Array.<number>|Uint8Array)} tokens Array of tokens that provide the
   * stream.
   */
  function Stream(tokens) {
    /** @type {!Array.<number>} */
    this.tokens = [].slice.call(tokens);
  }

  Stream.prototype = {
    /**
     * @return {boolean} True if end-of-stream has been hit.
     */
    endOfStream: function() {
      return !this.tokens.length;
    },

    /**
     * When a token is read from a stream, the first token in the
     * stream must be returned and subsequently removed, and
     * end-of-stream must be returned otherwise.
     *
     * @return {number} Get the next token from the stream, or
     * end_of_stream.
     */
     read: function() {
      if (!this.tokens.length)
        return end_of_stream;
       return this.tokens.shift();
     },

    /**
     * When one or more tokens are prepended to a stream, those tokens
     * must be inserted, in given order, before the first token in the
     * stream.
     *
     * @param {(number|!Array.<number>)} token The token(s) to prepend to the stream.
     */
    prepend: function(token) {
      if (Array.isArray(token)) {
        var tokens = /**@type {!Array.<number>}*/(token);
        while (tokens.length)
          this.tokens.unshift(tokens.pop());
      } else {
        this.tokens.unshift(token);
      }
    },

    /**
     * When one or more tokens are pushed to a stream, those tokens
     * must be inserted, in given order, after the last token in the
     * stream.
     *
     * @param {(number|!Array.<number>)} token The tokens(s) to prepend to the stream.
     */
    push: function(token) {
      if (Array.isArray(token)) {
        var tokens = /**@type {!Array.<number>}*/(token);
        while (tokens.length)
          this.tokens.push(tokens.shift());
      } else {
        this.tokens.push(token);
      }
    }
  };

  //
  // 4. Encodings
  //

  // 4.1 Encoders and decoders

  /** @const */
  var finished = -1;

  /**
   * @param {boolean} fatal If true, decoding errors raise an exception.
   * @param {number=} opt_code_point Override the standard fallback code point.
   * @return {number} The code point to insert on a decoding error.
   */
  function decoderError(fatal, opt_code_point) {
    if (fatal)
      throw TypeError('Decoder error');
    return opt_code_point || 0xFFFD;
  }

  /**
   * @param {number} code_point The code point that could not be encoded.
   * @return {number} Always throws, no value is actually returned.
   */
  function encoderError(code_point) {
    throw TypeError('The code point ' + code_point + ' could not be encoded.');
  }

  /** @interface */
  function Decoder() {}
  Decoder.prototype = {
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point, or |finished|.
     */
    handler: function(stream, bite) {}
  };

  /** @interface */
  function Encoder() {}
  Encoder.prototype = {
    /**
     * @param {Stream} stream The stream of code points being encoded.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit, or |finished|.
     */
    handler: function(stream, code_point) {}
  };

  // 4.2 Names and labels

  // TODO: Define @typedef for Encoding: {name:string,labels:Array.<string>}
  // https://github.com/google/closure-compiler/issues/247

  /**
   * @param {string} label The encoding label.
   * @return {?{name:string,labels:Array.<string>}}
   */
  function getEncoding(label) {
    // 1. Remove any leading and trailing ASCII whitespace from label.
    label = String(label).trim().toLowerCase();

    // 2. If label is an ASCII case-insensitive match for any of the
    // labels listed in the table below, return the corresponding
    // encoding, and failure otherwise.
    if (Object.prototype.hasOwnProperty.call(label_to_encoding, label)) {
      return label_to_encoding[label];
    }
    return null;
  }

  /**
   * Encodings table: http://encoding.spec.whatwg.org/encodings.json
   * @const
   * @type {!Array.<{
   *          heading: string,
   *          encodings: Array.<{name:string,labels:Array.<string>}>
   *        }>}
   */
  var encodings = [
    {
      "encodings": [
        {
          "labels": [
            "unicode-1-1-utf-8",
            "utf-8",
            "utf8"
          ],
          "name": "utf-8"
        }
      ],
      "heading": "The Encoding"
    },
    {
      "encodings": [
        {
          "labels": [
            "866",
            "cp866",
            "csibm866",
            "ibm866"
          ],
          "name": "ibm866"
        },
        {
          "labels": [
            "csisolatin2",
            "iso-8859-2",
            "iso-ir-101",
            "iso8859-2",
            "iso88592",
            "iso_8859-2",
            "iso_8859-2:1987",
            "l2",
            "latin2"
          ],
          "name": "iso-8859-2"
        },
        {
          "labels": [
            "csisolatin3",
            "iso-8859-3",
            "iso-ir-109",
            "iso8859-3",
            "iso88593",
            "iso_8859-3",
            "iso_8859-3:1988",
            "l3",
            "latin3"
          ],
          "name": "iso-8859-3"
        },
        {
          "labels": [
            "csisolatin4",
            "iso-8859-4",
            "iso-ir-110",
            "iso8859-4",
            "iso88594",
            "iso_8859-4",
            "iso_8859-4:1988",
            "l4",
            "latin4"
          ],
          "name": "iso-8859-4"
        },
        {
          "labels": [
            "csisolatincyrillic",
            "cyrillic",
            "iso-8859-5",
            "iso-ir-144",
            "iso8859-5",
            "iso88595",
            "iso_8859-5",
            "iso_8859-5:1988"
          ],
          "name": "iso-8859-5"
        },
        {
          "labels": [
            "arabic",
            "asmo-708",
            "csiso88596e",
            "csiso88596i",
            "csisolatinarabic",
            "ecma-114",
            "iso-8859-6",
            "iso-8859-6-e",
            "iso-8859-6-i",
            "iso-ir-127",
            "iso8859-6",
            "iso88596",
            "iso_8859-6",
            "iso_8859-6:1987"
          ],
          "name": "iso-8859-6"
        },
        {
          "labels": [
            "csisolatingreek",
            "ecma-118",
            "elot_928",
            "greek",
            "greek8",
            "iso-8859-7",
            "iso-ir-126",
            "iso8859-7",
            "iso88597",
            "iso_8859-7",
            "iso_8859-7:1987",
            "sun_eu_greek"
          ],
          "name": "iso-8859-7"
        },
        {
          "labels": [
            "csiso88598e",
            "csisolatinhebrew",
            "hebrew",
            "iso-8859-8",
            "iso-8859-8-e",
            "iso-ir-138",
            "iso8859-8",
            "iso88598",
            "iso_8859-8",
            "iso_8859-8:1988",
            "visual"
          ],
          "name": "iso-8859-8"
        },
        {
          "labels": [
            "csiso88598i",
            "iso-8859-8-i",
            "logical"
          ],
          "name": "iso-8859-8-i"
        },
        {
          "labels": [
            "csisolatin6",
            "iso-8859-10",
            "iso-ir-157",
            "iso8859-10",
            "iso885910",
            "l6",
            "latin6"
          ],
          "name": "iso-8859-10"
        },
        {
          "labels": [
            "iso-8859-13",
            "iso8859-13",
            "iso885913"
          ],
          "name": "iso-8859-13"
        },
        {
          "labels": [
            "iso-8859-14",
            "iso8859-14",
            "iso885914"
          ],
          "name": "iso-8859-14"
        },
        {
          "labels": [
            "csisolatin9",
            "iso-8859-15",
            "iso8859-15",
            "iso885915",
            "iso_8859-15",
            "l9"
          ],
          "name": "iso-8859-15"
        },
        {
          "labels": [
            "iso-8859-16"
          ],
          "name": "iso-8859-16"
        },
        {
          "labels": [
            "cskoi8r",
            "koi",
            "koi8",
            "koi8-r",
            "koi8_r"
          ],
          "name": "koi8-r"
        },
        {
          "labels": [
            "koi8-u"
          ],
          "name": "koi8-u"
        },
        {
          "labels": [
            "csmacintosh",
            "mac",
            "macintosh",
            "x-mac-roman"
          ],
          "name": "macintosh"
        },
        {
          "labels": [
            "dos-874",
            "iso-8859-11",
            "iso8859-11",
            "iso885911",
            "tis-620",
            "windows-874"
          ],
          "name": "windows-874"
        },
        {
          "labels": [
            "cp1250",
            "windows-1250",
            "x-cp1250"
          ],
          "name": "windows-1250"
        },
        {
          "labels": [
            "cp1251",
            "windows-1251",
            "x-cp1251"
          ],
          "name": "windows-1251"
        },
        {
          "labels": [
            "ansi_x3.4-1968",
            "ascii",
            "cp1252",
            "cp819",
            "csisolatin1",
            "ibm819",
            "iso-8859-1",
            "iso-ir-100",
            "iso8859-1",
            "iso88591",
            "iso_8859-1",
            "iso_8859-1:1987",
            "l1",
            "latin1",
            "us-ascii",
            "windows-1252",
            "x-cp1252"
          ],
          "name": "windows-1252"
        },
        {
          "labels": [
            "cp1253",
            "windows-1253",
            "x-cp1253"
          ],
          "name": "windows-1253"
        },
        {
          "labels": [
            "cp1254",
            "csisolatin5",
            "iso-8859-9",
            "iso-ir-148",
            "iso8859-9",
            "iso88599",
            "iso_8859-9",
            "iso_8859-9:1989",
            "l5",
            "latin5",
            "windows-1254",
            "x-cp1254"
          ],
          "name": "windows-1254"
        },
        {
          "labels": [
            "cp1255",
            "windows-1255",
            "x-cp1255"
          ],
          "name": "windows-1255"
        },
        {
          "labels": [
            "cp1256",
            "windows-1256",
            "x-cp1256"
          ],
          "name": "windows-1256"
        },
        {
          "labels": [
            "cp1257",
            "windows-1257",
            "x-cp1257"
          ],
          "name": "windows-1257"
        },
        {
          "labels": [
            "cp1258",
            "windows-1258",
            "x-cp1258"
          ],
          "name": "windows-1258"
        },
        {
          "labels": [
            "x-mac-cyrillic",
            "x-mac-ukrainian"
          ],
          "name": "x-mac-cyrillic"
        }
      ],
      "heading": "Legacy single-byte encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "chinese",
            "csgb2312",
            "csiso58gb231280",
            "gb2312",
            "gb_2312",
            "gb_2312-80",
            "gbk",
            "iso-ir-58",
            "x-gbk"
          ],
          "name": "gbk"
        },
        {
          "labels": [
            "gb18030"
          ],
          "name": "gb18030"
        }
      ],
      "heading": "Legacy multi-byte Chinese (simplified) encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "big5",
            "big5-hkscs",
            "cn-big5",
            "csbig5",
            "x-x-big5"
          ],
          "name": "big5"
        }
      ],
      "heading": "Legacy multi-byte Chinese (traditional) encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "cseucpkdfmtjapanese",
            "euc-jp",
            "x-euc-jp"
          ],
          "name": "euc-jp"
        },
        {
          "labels": [
            "csiso2022jp",
            "iso-2022-jp"
          ],
          "name": "iso-2022-jp"
        },
        {
          "labels": [
            "csshiftjis",
            "ms_kanji",
            "shift-jis",
            "shift_jis",
            "sjis",
            "windows-31j",
            "x-sjis"
          ],
          "name": "shift_jis"
        }
      ],
      "heading": "Legacy multi-byte Japanese encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "cseuckr",
            "csksc56011987",
            "euc-kr",
            "iso-ir-149",
            "korean",
            "ks_c_5601-1987",
            "ks_c_5601-1989",
            "ksc5601",
            "ksc_5601",
            "windows-949"
          ],
          "name": "euc-kr"
        }
      ],
      "heading": "Legacy multi-byte Korean encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "csiso2022kr",
            "hz-gb-2312",
            "iso-2022-cn",
            "iso-2022-cn-ext",
            "iso-2022-kr"
          ],
          "name": "replacement"
        },
        {
          "labels": [
            "utf-16be"
          ],
          "name": "utf-16be"
        },
        {
          "labels": [
            "utf-16",
            "utf-16le"
          ],
          "name": "utf-16le"
        },
        {
          "labels": [
            "x-user-defined"
          ],
          "name": "x-user-defined"
        }
      ],
      "heading": "Legacy miscellaneous encodings"
    }
  ];

  // Label to encoding registry.
  /** @type {Object.<string,{name:string,labels:Array.<string>}>} */
  var label_to_encoding = {};
  encodings.forEach(function(category) {
    category.encodings.forEach(function(encoding) {
      encoding.labels.forEach(function(label) {
        label_to_encoding[label] = encoding;
      });
    });
  });

  // Registry of of encoder/decoder factories, by encoding name.
  /** @type {Object.<string, function({fatal:boolean}): Encoder>} */
  var encoders = {};
  /** @type {Object.<string, function({fatal:boolean}): Decoder>} */
  var decoders = {};

  //
  // 5. Indexes
  //

  /**
   * @param {number} pointer The |pointer| to search for.
   * @param {(!Array.<?number>|undefined)} index The |index| to search within.
   * @return {?number} The code point corresponding to |pointer| in |index|,
   *     or null if |code point| is not in |index|.
   */
  function indexCodePointFor(pointer, index) {
    if (!index) return null;
    return index[pointer] || null;
  }

  /**
   * @param {number} code_point The |code point| to search for.
   * @param {!Array.<?number>} index The |index| to search within.
   * @return {?number} The first pointer corresponding to |code point| in
   *     |index|, or null if |code point| is not in |index|.
   */
  function indexPointerFor(code_point, index) {
    var pointer = index.indexOf(code_point);
    return pointer === -1 ? null : pointer;
  }

  /**
   * @param {string} name Name of the index.
   * @return {(!Array.<number>|!Array.<Array.<number>>)}
   *  */
  function index(name) {
    if (!('encoding-indexes' in global)) {
      throw Error("Indexes missing." +
                  " Did you forget to include encoding-indexes.js?");
    }
    return global['encoding-indexes'][name];
  }

  /**
   * @param {number} pointer The |pointer| to search for in the gb18030 index.
   * @return {?number} The code point corresponding to |pointer| in |index|,
   *     or null if |code point| is not in the gb18030 index.
   */
  function indexGB18030RangesCodePointFor(pointer) {
    // 1. If pointer is greater than 39419 and less than 189000, or
    // pointer is greater than 1237575, return null.
    if ((pointer > 39419 && pointer < 189000) || (pointer > 1237575))
      return null;

    // 2. Let offset be the last pointer in index gb18030 ranges that
    // is equal to or less than pointer and let code point offset be
    // its corresponding code point.
    var offset = 0;
    var code_point_offset = 0;
    var idx = index('gb18030');
    var i;
    for (i = 0; i < idx.length; ++i) {
      /** @type {!Array.<number>} */
      var entry = idx[i];
      if (entry[0] <= pointer) {
        offset = entry[0];
        code_point_offset = entry[1];
      } else {
        break;
      }
    }

    // 3. Return a code point whose value is code point offset +
    // pointer − offset.
    return code_point_offset + pointer - offset;
  }

  /**
   * @param {number} code_point The |code point| to locate in the gb18030 index.
   * @return {number} The first pointer corresponding to |code point| in the
   *     gb18030 index.
   */
  function indexGB18030RangesPointerFor(code_point) {
    // 1. Let offset be the last code point in index gb18030 ranges
    // that is equal to or less than code point and let pointer offset
    // be its corresponding pointer.
    var offset = 0;
    var pointer_offset = 0;
    var idx = index('gb18030');
    var i;
    for (i = 0; i < idx.length; ++i) {
      /** @type {!Array.<number>} */
      var entry = idx[i];
      if (entry[1] <= code_point) {
        offset = entry[1];
        pointer_offset = entry[0];
      } else {
        break;
      }
    }

    // 2. Return a pointer whose value is pointer offset + code point
    // − offset.
    return pointer_offset + code_point - offset;
  }

  /**
   * @param {number} code_point The |code_point| to search for in the shift_jis index.
   * @return {?number} The code point corresponding to |pointer| in |index|,
   *     or null if |code point| is not in the shift_jis index.
   */
  function indexShiftJISPointerFor(code_point) {
    // 1. Let index be index jis0208 excluding all pointers in the
    // range 8272 to 8835.
    var pointer = indexPointerFor(code_point, index('jis0208'));
    if (pointer === null || inRange(pointer, 8272, 8835))
      return null;

    // 2. Return the index pointer for code point in index.
    return pointer;
  }

  //
  // 7. API
  //

  /** @const */ var DEFAULT_ENCODING = 'utf-8';

  // 7.1 Interface TextDecoder

  /**
   * @constructor
   * @param {string=} encoding The label of the encoding;
   *     defaults to 'utf-8'.
   * @param {Object=} options
   */
  function TextDecoder(encoding, options) {
    if (!(this instanceof TextDecoder)) {
      return new TextDecoder(encoding, options);
    }
    encoding = encoding !== undefined ? String(encoding) : DEFAULT_ENCODING;
    options = ToDictionary(options);
    /** @private */
    this._encoding = getEncoding(encoding);
    if (this._encoding === null || this._encoding.name === 'replacement')
      throw RangeError('Unknown encoding: ' + encoding);

    if (!decoders[this._encoding.name]) {
      throw Error('Decoder not present.' +
                  ' Did you forget to include encoding-indexes.js?');
    }

    /** @private @type {boolean} */
    this._streaming = false;
    /** @private @type {boolean} */
    this._BOMseen = false;
    /** @private @type {?Decoder} */
    this._decoder = null;
    /** @private @type {boolean} */
    this._fatal = Boolean(options['fatal']);
    /** @private @type {boolean} */
    this._ignoreBOM = Boolean(options['ignoreBOM']);

    if (Object.defineProperty) {
      Object.defineProperty(this, 'encoding', {value: this._encoding.name});
      Object.defineProperty(this, 'fatal', {value: this._fatal});
      Object.defineProperty(this, 'ignoreBOM', {value: this._ignoreBOM});
    } else {
      this.encoding = this._encoding.name;
      this.fatal = this._fatal;
      this.ignoreBOM = this._ignoreBOM;
    }

    return this;
  }

  TextDecoder.prototype = {
    /**
     * @param {ArrayBufferView=} input The buffer of bytes to decode.
     * @param {Object=} options
     * @return {string} The decoded string.
     */
    decode: function decode(input, options) {
      var bytes;
      if (typeof input === 'object' && input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
      } else if (typeof input === 'object' && 'buffer' in input &&
                 input.buffer instanceof ArrayBuffer) {
        bytes = new Uint8Array(input.buffer,
                               input.byteOffset,
                               input.byteLength);
      } else {
        bytes = new Uint8Array(0);
      }

      options = ToDictionary(options);

      if (!this._streaming) {
        this._decoder = decoders[this._encoding.name]({fatal: this._fatal});
        this._BOMseen = false;
      }
      this._streaming = Boolean(options['stream']);

      var input_stream = new Stream(bytes);

      var code_points = [];

      /** @type {?(number|!Array.<number>)} */
      var result;

      while (!input_stream.endOfStream()) {
        result = this._decoder.handler(input_stream, input_stream.read());
        if (result === finished)
          break;
        if (result === null)
          continue;
        if (Array.isArray(result))
          code_points.push.apply(code_points, /**@type {!Array.<number>}*/(result));
        else
          code_points.push(result);
      }
      if (!this._streaming) {
        do {
          result = this._decoder.handler(input_stream, input_stream.read());
          if (result === finished)
            break;
          if (result === null)
            continue;
          if (Array.isArray(result))
            code_points.push.apply(code_points, /**@type {!Array.<number>}*/(result));
          else
            code_points.push(result);
        } while (!input_stream.endOfStream());
        this._decoder = null;
      }

      if (code_points.length) {
        // If encoding is one of utf-8, utf-16be, and utf-16le, and
        // ignore BOM flag and BOM seen flag are unset, run these
        // subsubsteps:
        if (['utf-8', 'utf-16le', 'utf-16be'].indexOf(this.encoding) !== -1 &&
            !this._ignoreBOM && !this._BOMseen) {
          // If token is U+FEFF, set BOM seen flag.
          if (code_points[0] === 0xFEFF) {
            this._BOMseen = true;
            code_points.shift();
          } else {
            // Otherwise, if token is not end-of-stream, set BOM seen
            // flag and append token to output.
            this._BOMseen = true;
          }
        }
      }

      return codePointsToString(code_points);
    }
  };

  // 7.2 Interface TextEncoder

  /**
   * @constructor
   * @param {string=} encoding The label of the encoding;
   *     defaults to 'utf-8'.
   * @param {Object=} options
   */
  function TextEncoder(encoding, options) {
    if (!(this instanceof TextEncoder))
      return new TextEncoder(encoding, options);
    encoding = encoding !== undefined ? String(encoding) : DEFAULT_ENCODING;
    options = ToDictionary(options);
    /** @private */
    this._encoding = getEncoding(encoding);
    if (this._encoding === null || this._encoding.name === 'replacement')
      throw RangeError('Unknown encoding: ' + encoding);

    var allowLegacyEncoding =
          Boolean(options['NONSTANDARD_allowLegacyEncoding']);
    var isLegacyEncoding = (this._encoding.name !== 'utf-8' &&
                            this._encoding.name !== 'utf-16le' &&
                            this._encoding.name !== 'utf-16be');
    if (this._encoding === null || (isLegacyEncoding && !allowLegacyEncoding))
      throw RangeError('Unknown encoding: ' + encoding);

    if (!encoders[this._encoding.name]) {
      throw Error('Encoder not present.' +
                  ' Did you forget to include encoding-indexes.js?');
    }

    /** @private @type {boolean} */
    this._streaming = false;
    /** @private @type {?Encoder} */
    this._encoder = null;
    /** @private @type {{fatal: boolean}} */
    this._options = {fatal: Boolean(options['fatal'])};

    if (Object.defineProperty)
      Object.defineProperty(this, 'encoding', {value: this._encoding.name});
    else
      this.encoding = this._encoding.name;

    return this;
  }

  TextEncoder.prototype = {
    /**
     * @param {string=} opt_string The string to encode.
     * @param {Object=} options
     * @return {Uint8Array} Encoded bytes, as a Uint8Array.
     */
    encode: function encode(opt_string, options) {
      opt_string = opt_string ? String(opt_string) : '';
      options = ToDictionary(options);

      // NOTE: This option is nonstandard. None of the encodings
      // permitted for encoding (i.e. UTF-8, UTF-16) are stateful,
      // so streaming is not necessary.
      if (!this._streaming)
        this._encoder = encoders[this._encoding.name](this._options);
      this._streaming = Boolean(options['stream']);

      var bytes = [];
      var input_stream = new Stream(stringToCodePoints(opt_string));
      /** @type {?(number|!Array.<number>)} */
      var result;
      while (!input_stream.endOfStream()) {
        result = this._encoder.handler(input_stream, input_stream.read());
        if (result === finished)
          break;
        if (Array.isArray(result))
          bytes.push.apply(bytes, /**@type {!Array.<number>}*/(result));
        else
          bytes.push(result);
      }
      if (!this._streaming) {
        while (true) {
          result = this._encoder.handler(input_stream, input_stream.read());
          if (result === finished)
            break;
          if (Array.isArray(result))
            bytes.push.apply(bytes, /**@type {!Array.<number>}*/(result));
          else
            bytes.push(result);
        }
        this._encoder = null;
      }
      return new Uint8Array(bytes);
    }
  };


  //
  // 8. The encoding
  //

  // 8.1 utf-8

  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function UTF8Decoder(options) {
    var fatal = options.fatal;

    // utf-8's decoder's has an associated utf-8 code point, utf-8
    // bytes seen, and utf-8 bytes needed (all initially 0), a utf-8
    // lower boundary (initially 0x80), and a utf-8 upper boundary
    // (initially 0xBF).
    var /** @type {number} */ utf8_code_point = 0,
        /** @type {number} */ utf8_bytes_seen = 0,
        /** @type {number} */ utf8_bytes_needed = 0,
        /** @type {number} */ utf8_lower_boundary = 0x80,
        /** @type {number} */ utf8_upper_boundary = 0xBF;

    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and utf-8 bytes needed is not 0,
      // set utf-8 bytes needed to 0 and return error.
      if (bite === end_of_stream && utf8_bytes_needed !== 0) {
        utf8_bytes_needed = 0;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream, return finished.
      if (bite === end_of_stream)
        return finished;

      // 3. If utf-8 bytes needed is 0, based on byte:
      if (utf8_bytes_needed === 0) {

        // 0x00 to 0x7F
        if (inRange(bite, 0x00, 0x7F)) {
          // Return a code point whose value is byte.
          return bite;
        }

        // 0xC2 to 0xDF
        if (inRange(bite, 0xC2, 0xDF)) {
          // Set utf-8 bytes needed to 1 and utf-8 code point to byte
          // − 0xC0.
          utf8_bytes_needed = 1;
          utf8_code_point = bite - 0xC0;
        }

        // 0xE0 to 0xEF
        else if (inRange(bite, 0xE0, 0xEF)) {
          // 1. If byte is 0xE0, set utf-8 lower boundary to 0xA0.
          if (bite === 0xE0)
            utf8_lower_boundary = 0xA0;
          // 2. If byte is 0xED, set utf-8 upper boundary to 0x9F.
          if (bite === 0xED)
            utf8_upper_boundary = 0x9F;
          // 3. Set utf-8 bytes needed to 2 and utf-8 code point to
          // byte − 0xE0.
          utf8_bytes_needed = 2;
          utf8_code_point = bite - 0xE0;
        }

        // 0xF0 to 0xF4
        else if (inRange(bite, 0xF0, 0xF4)) {
          // 1. If byte is 0xF0, set utf-8 lower boundary to 0x90.
          if (bite === 0xF0)
            utf8_lower_boundary = 0x90;
          // 2. If byte is 0xF4, set utf-8 upper boundary to 0x8F.
          if (bite === 0xF4)
            utf8_upper_boundary = 0x8F;
          // 3. Set utf-8 bytes needed to 3 and utf-8 code point to
          // byte − 0xF0.
          utf8_bytes_needed = 3;
          utf8_code_point = bite - 0xF0;
        }

        // Otherwise
        else {
          // Return error.
          return decoderError(fatal);
        }

        // Then (byte is in the range 0xC2 to 0xF4) set utf-8 code
        // point to utf-8 code point << (6 × utf-8 bytes needed) and
        // return continue.
        utf8_code_point = utf8_code_point << (6 * utf8_bytes_needed);
        return null;
      }

      // 4. If byte is not in the range utf-8 lower boundary to utf-8
      // upper boundary, run these substeps:
      if (!inRange(bite, utf8_lower_boundary, utf8_upper_boundary)) {

        // 1. Set utf-8 code point, utf-8 bytes needed, and utf-8
        // bytes seen to 0, set utf-8 lower boundary to 0x80, and set
        // utf-8 upper boundary to 0xBF.
        utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
        utf8_lower_boundary = 0x80;
        utf8_upper_boundary = 0xBF;

        // 2. Prepend byte to stream.
        stream.prepend(bite);

        // 3. Return error.
        return decoderError(fatal);
      }

      // 5. Set utf-8 lower boundary to 0x80 and utf-8 upper boundary
      // to 0xBF.
      utf8_lower_boundary = 0x80;
      utf8_upper_boundary = 0xBF;

      // 6. Increase utf-8 bytes seen by one and set utf-8 code point
      // to utf-8 code point + (byte − 0x80) << (6 × (utf-8 bytes
      // needed − utf-8 bytes seen)).
      utf8_bytes_seen += 1;
      utf8_code_point += (bite - 0x80) << (6 * (utf8_bytes_needed - utf8_bytes_seen));

      // 7. If utf-8 bytes seen is not equal to utf-8 bytes needed,
      // continue.
      if (utf8_bytes_seen !== utf8_bytes_needed)
        return null;

      // 8. Let code point be utf-8 code point.
      var code_point = utf8_code_point;

      // 9. Set utf-8 code point, utf-8 bytes needed, and utf-8 bytes
      // seen to 0.
      utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;

      // 10. Return a code point whose value is code point.
      return code_point;
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function UTF8Encoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+007F, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x007f))
        return code_point;

      // 3. Set count and offset based on the range code point is in:
      var count, offset;
      // U+0080 to U+07FF:    1 and 0xC0
      if (inRange(code_point, 0x0080, 0x07FF)) {
        count = 1;
        offset = 0xC0;
      }
      // U+0800 to U+FFFF:    2 and 0xE0
      else if (inRange(code_point, 0x0800, 0xFFFF)) {
        count = 2;
        offset = 0xE0;
      }
      // U+10000 to U+10FFFF: 3 and 0xF0
      else if (inRange(code_point, 0x10000, 0x10FFFF)) {
        count = 3;
        offset = 0xF0;
      }

      // 4.Let bytes be a byte sequence whose first byte is (code
      // point >> (6 × count)) + offset.
      var bytes = [(code_point >> (6 * count)) + offset];

      // 5. Run these substeps while count is greater than 0:
      while (count > 0) {

        // 1. Set temp to code point >> (6 × (count − 1)).
        var temp = code_point >> (6 * (count - 1));

        // 2. Append to bytes 0x80 | (temp & 0x3F).
        bytes.push(0x80 | (temp & 0x3F));

        // 3. Decrease count by one.
        count -= 1;
      }

      // 6. Return bytes bytes, in order.
      return bytes;
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['utf-8'] = function(options) {
    return new UTF8Encoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['utf-8'] = function(options) {
    return new UTF8Decoder(options);
  };

  //
  // 9. Legacy single-byte encodings
  //

  // 9.1 single-byte decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {!Array.<number>} index The encoding index.
   * @param {{fatal: boolean}} options
   */
  function SingleByteDecoder(index, options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream, return finished.
      if (bite === end_of_stream)
        return finished;

      // 2. If byte is in the range 0x00 to 0x7F, return a code point
      // whose value is byte.
      if (inRange(bite, 0x00, 0x7F))
        return bite;

      // 3. Let code point be the index code point for byte − 0x80 in
      // index single-byte.
      var code_point = index[bite - 0x80];

      // 4. If code point is null, return error.
      if (code_point === null)
        return decoderError(fatal);

      // 5. Return a code point whose value is code point.
      return code_point;
    };
  }

  // 9.2 single-byte encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {!Array.<?number>} index The encoding index.
   * @param {{fatal: boolean}} options
   */
  function SingleByteEncoder(index, options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+007F, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x007F))
        return code_point;

      // 3. Let pointer be the index pointer for code point in index
      // single-byte.
      var pointer = indexPointerFor(code_point, index);

      // 4. If pointer is null, return error with code point.
      if (pointer === null)
        encoderError(code_point);

      // 5. Return a byte whose value is pointer + 0x80.
      return pointer + 0x80;
    };
  }

  (function() {
    if (!('encoding-indexes' in global))
      return;
    encodings.forEach(function(category) {
      if (category.heading !== 'Legacy single-byte encodings')
        return;
      category.encodings.forEach(function(encoding) {
        var name = encoding.name;
        var idx = index(name);
        /** @param {{fatal: boolean}} options */
        decoders[name] = function(options) {
          return new SingleByteDecoder(idx, options);
        };
        /** @param {{fatal: boolean}} options */
        encoders[name] = function(options) {
          return new SingleByteEncoder(idx, options);
        };
      });
    });
  }());

  //
  // 10. Legacy multi-byte Chinese (simplified) encodings
  //

  // 10.1 gbk

  // 10.1.1 gbk decoder
  // gbk's decoder is gb18030's decoder.
  /** @param {{fatal: boolean}} options */
  decoders['gbk'] = function(options) {
    return new GB18030Decoder(options);
  };

  // 10.1.2 gbk encoder
  // gbk's encoder is gb18030's encoder with its gbk flag set.
  /** @param {{fatal: boolean}} options */
  encoders['gbk'] = function(options) {
    return new GB18030Encoder(options, true);
  };

  // 10.2 gb18030

  // 10.2.1 gb18030 decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function GB18030Decoder(options) {
    var fatal = options.fatal;
    // gb18030's decoder has an associated gb18030 first, gb18030
    // second, and gb18030 third (all initially 0x00).
    var /** @type {number} */ gb18030_first = 0x00,
        /** @type {number} */ gb18030_second = 0x00,
        /** @type {number} */ gb18030_third = 0x00;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and gb18030 first, gb18030
      // second, and gb18030 third are 0x00, return finished.
      if (bite === end_of_stream && gb18030_first === 0x00 &&
          gb18030_second === 0x00 && gb18030_third === 0x00) {
        return finished;
      }
      // 2. If byte is end-of-stream, and gb18030 first, gb18030
      // second, or gb18030 third is not 0x00, set gb18030 first,
      // gb18030 second, and gb18030 third to 0x00, and return error.
      if (bite === end_of_stream &&
          (gb18030_first !== 0x00 || gb18030_second !== 0x00 || gb18030_third !== 0x00)) {
        gb18030_first = 0x00;
        gb18030_second = 0x00;
        gb18030_third = 0x00;
        decoderError(fatal);
      }
      var code_point;
      // 3. If gb18030 third is not 0x00, run these substeps:
      if (gb18030_third !== 0x00) {
        // 1. Let code point be null.
        code_point = null;
        // 2. If byte is in the range 0x30 to 0x39, set code point to
        // the index gb18030 ranges code point for (((gb18030 first −
        // 0x81) × 10 + gb18030 second − 0x30) × 126 + gb18030 third −
        // 0x81) × 10 + byte − 0x30.
        if (inRange(bite, 0x30, 0x39)) {
          code_point = indexGB18030RangesCodePointFor(
              (((gb18030_first - 0x81) * 10 + (gb18030_second - 0x30)) * 126 +
               (gb18030_third - 0x81)) * 10 + bite - 0x30);
        }

        // 3. Let buffer be a byte sequence consisting of gb18030
        // second, gb18030 third, and byte, in order.
        var buffer = [gb18030_second, gb18030_third, bite];

        // 4. Set gb18030 first, gb18030 second, and gb18030 third to
        // 0x00.
        gb18030_first = 0x00;
        gb18030_second = 0x00;
        gb18030_third = 0x00;

        // 5. If code point is null, prepend buffer to stream and
        // return error.
        if (code_point === null) {
          stream.prepend(buffer);
          return decoderError(fatal);
        }

        // 6. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If gb18030 second is not 0x00, run these substeps:
      if (gb18030_second !== 0x00) {

        // 1. If byte is in the range 0x81 to 0xFE, set gb18030 third
        // to byte and return continue.
        if (inRange(bite, 0x81, 0xFE)) {
          gb18030_third = bite;
          return null;
        }

        // 2. Prepend gb18030 second followed by byte to stream, set
        // gb18030 first and gb18030 second to 0x00, and return error.
        stream.prepend([gb18030_second, bite]);
        gb18030_first = 0x00;
        gb18030_second = 0x00;
        return decoderError(fatal);
      }

      // 5. If gb18030 first is not 0x00, run these substeps:
      if (gb18030_first !== 0x00) {

        // 1. If byte is in the range 0x30 to 0x39, set gb18030 second
        // to byte and return continue.
        if (inRange(bite, 0x30, 0x39)) {
          gb18030_second = bite;
          return null;
        }

        // 2. Let lead be gb18030 first, let pointer be null, and set
        // gb18030 first to 0x00.
        var lead = gb18030_first;
        var pointer = null;
        gb18030_first = 0x00;

        // 3. Let offset be 0x40 if byte is less than 0x7F and 0x41
        // otherwise.
        var offset = bite < 0x7F ? 0x40 : 0x41;

        // 4. If byte is in the range 0x40 to 0x7E or 0x80 to 0xFE,
        // set pointer to (lead − 0x81) × 190 + (byte − offset).
        if (inRange(bite, 0x40, 0x7E) || inRange(bite, 0x80, 0xFE))
          pointer = (lead - 0x81) * 190 + (bite - offset);

        // 5. Let code point be null if pointer is null and the index
        // code point for pointer in index gb18030 otherwise.
        code_point = pointer === null ? null :
            indexCodePointFor(pointer, index('gb18030'));

        // 6. If pointer is null, prepend byte to stream.
        if (pointer === null)
          stream.prepend(bite);

        // 7. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 8. Return a code point whose value is code point.
        return code_point;
      }

      // 6. If byte is in the range 0x00 to 0x7F, return a code point
      // whose value is byte.
      if (inRange(bite, 0x00, 0x7F))
        return bite;

      // 7. If byte is 0x80, return code point U+20AC.
      if (bite === 0x80)
        return 0x20AC;

      // 8. If byte is in the range 0x81 to 0xFE, set gb18030 first to
      // byte and return continue.
      if (inRange(bite, 0x81, 0xFE)) {
        gb18030_first = bite;
        return null;
      }

      // 9. Return error.
      return decoderError(fatal);
    };
  }

  // 10.2.2 gb18030 encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   * @param {boolean=} gbk_flag
   */
  function GB18030Encoder(options, gbk_flag) {
    var fatal = options.fatal;
    // gb18030's decoder has an associated gbk flag (initially unset).
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+007F, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x007F)) {
        return code_point;
      }

      // 3. If the gbk flag is set and code point is U+20AC, return
      // byte 0x80.
      if (gbk_flag && code_point === 0x20AC)
        return 0x80;

      // 4. Let pointer be the index pointer for code point in index
      // gb18030.
      var pointer = indexPointerFor(code_point, index('gb18030'));

      // 5. If pointer is not null, run these substeps:
      if (pointer !== null) {

        // 1. Let lead be pointer / 190 + 0x81.
        var lead = div(pointer, 190) + 0x81;

        // 2. Let trail be pointer % 190.
        var trail = pointer % 190;

        // 3. Let offset be 0x40 if trail is less than 0x3F and 0x41 otherwise.
        var offset = trail < 0x3F ? 0x40 : 0x41;

        // 4. Return two bytes whose values are lead and trail + offset.
        return [lead, trail + offset];
      }

      // 6. If gbk flag is set, return error with code point.
      if (gbk_flag)
        return encoderError(code_point);

      // 7. Set pointer to the index gb18030 ranges pointer for code
      // point.
      pointer = indexGB18030RangesPointerFor(code_point);

      // 8. Let byte1 be pointer / 10 / 126 / 10.
      var byte1 = div(div(div(pointer, 10), 126), 10);

      // 9. Set pointer to pointer − byte1 × 10 × 126 × 10.
      pointer = pointer - byte1 * 10 * 126 * 10;

      // 10. Let byte2 be pointer / 10 / 126.
      var byte2 = div(div(pointer, 10), 126);

      // 11. Set pointer to pointer − byte2 × 10 × 126.
      pointer = pointer - byte2 * 10 * 126;

      // 12. Let byte3 be pointer / 10.
      var byte3 = div(pointer, 10);

      // 13. Let byte4 be pointer − byte3 × 10.
      var byte4 = pointer - byte3 * 10;

      // 14. Return four bytes whose values are byte1 + 0x81, byte2 +
      // 0x30, byte3 + 0x81, byte4 + 0x30.
      return [byte1 + 0x81,
              byte2 + 0x30,
              byte3 + 0x81,
              byte4 + 0x30];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['gb18030'] = function(options) {
    return new GB18030Encoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['gb18030'] = function(options) {
    return new GB18030Decoder(options);
  };


  //
  // 11. Legacy multi-byte Chinese (traditional) encodings
  //

  // 11.1 big5

  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function Big5Decoder(options) {
    var fatal = options.fatal;
    // big5's decoder has an associated big5 lead (initially 0x00).
    var /** @type {number} */ big5_lead = 0x00;

    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and big5 lead is not 0x00, set
      // big5 lead to 0x00 and return error.
      if (bite === end_of_stream && big5_lead !== 0x00) {
        big5_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and big5 lead is 0x00, return
      // finished.
      if (bite === end_of_stream && big5_lead === 0x00)
        return finished;

      // 3. If big5 lead is not 0x00, let lead be big5 lead, let
      // pointer be null, set big5 lead to 0x00, and then run these
      // substeps:
      if (big5_lead !== 0x00) {
        var lead = big5_lead;
        var pointer = null;
        big5_lead = 0x00;

        // 1. Let offset be 0x40 if byte is less than 0x7F and 0x62
        // otherwise.
        var offset = bite < 0x7F ? 0x40 : 0x62;

        // 2. If byte is in the range 0x40 to 0x7E or 0xA1 to 0xFE,
        // set pointer to (lead − 0x81) × 157 + (byte − offset).
        if (inRange(bite, 0x40, 0x7E) || inRange(bite, 0xA1, 0xFE))
          pointer = (lead - 0x81) * 157 + (bite - offset);

        // 3. If there is a row in the table below whose first column
        // is pointer, return the two code points listed in its second
        // column
        // Pointer | Code points
        // --------+--------------
        // 1133    | U+00CA U+0304
        // 1135    | U+00CA U+030C
        // 1164    | U+00EA U+0304
        // 1166    | U+00EA U+030C
        switch (pointer) {
          case 1133: return [0x00CA, 0x0304];
          case 1135: return [0x00CA, 0x030C];
          case 1164: return [0x00EA, 0x0304];
          case 1166: return [0x00EA, 0x030C];
        }

        // 4. Let code point be null if pointer is null and the index
        // code point for pointer in index big5 otherwise.
        var code_point = (pointer === null) ? null :
            indexCodePointFor(pointer, index('big5'));

        // 5. If pointer is null and byte is in the range 0x00 to
        // 0x7F, prepend byte to stream.
        if (pointer === null)
          stream.prepend(bite);

        // 6. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 7. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If byte is in the range 0x00 to 0x7F, return a code point
      // whose value is byte.
      if (inRange(bite, 0x00, 0x7F))
        return bite;

      // 5. If byte is in the range 0x81 to 0xFE, set big5 lead to
      // byte and return continue.
      if (inRange(bite, 0x81, 0xFE)) {
        big5_lead = bite;
        return null;
      }

      // 6. Return error.
      return decoderError(fatal);
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function Big5Encoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+007F, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x007F))
        return code_point;

      // 3. Let pointer be the index pointer for code point in index
      // big5.
      var pointer = indexPointerFor(code_point, index('big5'));

      // 4. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 5. Let lead be pointer / 157 + 0x81.
      var lead = div(pointer, 157) + 0x81;

      // 6. If lead is less than 0xA1, return error with code point.
      if (lead < 0xA1)
        return encoderError(code_point);

      // 7. Let trail be pointer % 157.
      var trail = pointer % 157;

      // 8. Let offset be 0x40 if trail is less than 0x3F and 0x62
      // otherwise.
      var offset = trail < 0x3F ? 0x40 : 0x62;

      // Return two bytes whose values are lead and trail + offset.
      return [lead, trail + offset];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['big5'] = function(options) {
    return new Big5Encoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['big5'] = function(options) {
    return new Big5Decoder(options);
  };


  //
  // 12. Legacy multi-byte Japanese encodings
  //

  // 12.1 euc-jp

  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function EUCJPDecoder(options) {
    var fatal = options.fatal;

    // euc-jp's decoder has an associated euc-jp jis0212 flag
    // (initially unset) and euc-jp lead (initially 0x00).
    var /** @type {boolean} */ eucjp_jis0212_flag = false,
        /** @type {number} */ eucjp_lead = 0x00;

    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and euc-jp lead is not 0x00, set
      // euc-jp lead to 0x00, and return error.
      if (bite === end_of_stream && eucjp_lead !== 0x00) {
        eucjp_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and euc-jp lead is 0x00, return
      // finished.
      if (bite === end_of_stream && eucjp_lead === 0x00)
        return finished;

      // 3. If euc-jp lead is 0x8E and byte is in the range 0xA1 to
      // 0xDF, set euc-jp lead to 0x00 and return a code point whose
      // value is 0xFF61 + byte − 0xA1.
      if (eucjp_lead === 0x8E && inRange(bite, 0xA1, 0xDF)) {
        eucjp_lead = 0x00;
        return 0xFF61 + bite - 0xA1;
      }

      // 4. If euc-jp lead is 0x8F and byte is in the range 0xA1 to
      // 0xFE, set the euc-jp jis0212 flag, set euc-jp lead to byte,
      // and return continue.
      if (eucjp_lead === 0x8F && inRange(bite, 0xA1, 0xFE)) {
        eucjp_jis0212_flag = true;
        eucjp_lead = bite;
        return null;
      }

      // 5. If euc-jp lead is not 0x00, let lead be euc-jp lead, set
      // euc-jp lead to 0x00, and run these substeps:
      if (eucjp_lead !== 0x00) {
        var lead = eucjp_lead;
        eucjp_lead = 0x00;

        // 1. Let code point be null.
        var code_point = null;

        // 2. If lead and byte are both in the range 0xA1 to 0xFE, set
        // code point to the index code point for (lead − 0xA1) × 94 +
        // byte − 0xA1 in index jis0208 if the euc-jp jis0212 flag is
        // unset and in index jis0212 otherwise.
        if (inRange(lead, 0xA1, 0xFE) && inRange(bite, 0xA1, 0xFE)) {
          code_point = indexCodePointFor(
            (lead - 0xA1) * 94 + (bite - 0xA1),
            index(!eucjp_jis0212_flag ? 'jis0208' : 'jis0212'));
        }

        // 3. Unset the euc-jp jis0212 flag.
        eucjp_jis0212_flag = false;

        // 4. If byte is not in the range 0xA1 to 0xFE, prepend byte
        // to stream.
        if (!inRange(bite, 0xA1, 0xFE))
          stream.prepend(bite);

        // 5. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 6. Return a code point whose value is code point.
        return code_point;
      }

      // 6. If byte is in the range 0x00 to 0x7F, return a code point
      // whose value is byte.
      if (inRange(bite, 0x00, 0x7F))
        return bite;

      // 7. If byte is 0x8E, 0x8F, or in the range 0xA1 to 0xFE, set
      // euc-jp lead to byte and return continue.
      if (bite === 0x8E || bite === 0x8F || inRange(bite, 0xA1, 0xFE)) {
        eucjp_lead = bite;
        return null;
      }

      // 8. Return error.
      return decoderError(fatal);
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function EUCJPEncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+007F, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x007F))
        return code_point;

      // 3. If code point is U+00A5, return byte 0x5C.
      if (code_point === 0x00A5)
        return 0x5C;

      // 4. If code point is U+203E, return byte 0x7E.
      if (code_point === 0x203E)
        return 0x7E;

      // 5. If code point is in the range U+FF61 to U+FF9F, return two
      // bytes whose values are 0x8E and code point − 0xFF61 + 0xA1.
      if (inRange(code_point, 0xFF61, 0xFF9F))
        return [0x8E, code_point - 0xFF61 + 0xA1];

      // 6. Let pointer be the index pointer for code point in index
      // jis0208.
      var pointer = indexPointerFor(code_point, index('jis0208'));

      // 7. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 8. Let lead be pointer / 94 + 0xA1.
      var lead = div(pointer, 94) + 0xA1;

      // 9. Let trail be pointer % 94 + 0xA1.
      var trail = pointer % 94 + 0xA1;

      // 10. Return two bytes whose values are lead and trail.
      return [lead, trail];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['euc-jp'] = function(options) {
    return new EUCJPEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['euc-jp'] = function(options) {
    return new EUCJPDecoder(options);
  };

  // 12.2 iso-2022-jp

  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function ISO2022JPDecoder(options) {
    var fatal = options.fatal;
    /** @enum */
    var states = {
      ASCII: 0,
      Roman: 1,
      Katakana: 2,
      LeadByte: 3,
      TrailByte: 4,
      EscapeStart: 5,
      Escape: 6
    };
    // iso-2022-jp's decoder has an associated iso-2022-jp decoder
    // state (initially ASCII), iso-2022-jp decoder output state
    // (initially ASCII), iso-2022-jp lead (initially 0x00), and
    // iso-2022-jp output flag (initially unset).
    var /** @type {number} */ iso2022jp_decoder_state = states.ASCII,
        /** @type {number} */ iso2022jp_decoder_output_state = states.ASCII,
        /** @type {number} */ iso2022jp_lead = 0x00,
        /** @type {boolean} */ iso2022jp_output_flag = false;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // switching on iso-2022-jp decoder state:
      switch (iso2022jp_decoder_state) {
      default:
      case states.ASCII:
        // ASCII
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x00 to 0x7F, excluding 0x0E, 0x0F, and 0x1B
        if (inRange(bite, 0x00, 0x7F) && bite !== 0x0E
            && bite !== 0x0F && bite !== 0x1B) {
          // Unset the iso-2022-jp output flag and return a code point
          // whose value is byte.
          iso2022jp_output_flag = false;
          return bite;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.Roman:
        // Roman
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x5C
        if (bite === 0x5C) {
          // Unset the iso-2022-jp output flag and return code point
          // U+00A5.
          iso2022jp_output_flag = false;
          return 0x00A5;
        }

        // 0x7E
        if (bite === 0x7E) {
          // Unset the iso-2022-jp output flag and return code point
          // U+203E.
          iso2022jp_output_flag = false;
          return 0x203E;
        }

        // 0x00 to 0x7F, excluding 0x0E, 0x0F, 0x1B, 0x5C, and 0x7E
        if (inRange(bite, 0x00, 0x7F) && bite !== 0x0E && bite !== 0x0F
            && bite !== 0x1B && bite !== 0x5C && bite !== 0x7E) {
          // Unset the iso-2022-jp output flag and return a code point
          // whose value is byte.
          iso2022jp_output_flag = false;
          return bite;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.Katakana:
        // Katakana
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x21 to 0x5F
        if (inRange(bite, 0x21, 0x5F)) {
          // Unset the iso-2022-jp output flag and return a code point
          // whose value is 0xFF61 + byte − 0x21.
          iso2022jp_output_flag = false;
          return 0xFF61 + bite - 0x21;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.LeadByte:
        // Lead byte
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x21 to 0x7E
        if (inRange(bite, 0x21, 0x7E)) {
          // Unset the iso-2022-jp output flag, set iso-2022-jp lead
          // to byte, iso-2022-jp decoder state to trail byte, and
          // return continue.
          iso2022jp_output_flag = false;
          iso2022jp_lead = bite;
          iso2022jp_decoder_state = states.TrailByte;
          return null;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.TrailByte:
        // Trail byte
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return decoderError(fatal);
        }

        // 0x21 to 0x7E
        if (inRange(bite, 0x21, 0x7E)) {
          // 1. Set the iso-2022-jp decoder state to lead byte.
          iso2022jp_decoder_state = states.LeadByte;

          // 2. Let pointer be (iso-2022-jp lead − 0x21) × 94 + byte − 0x21.
          var pointer = (iso2022jp_lead - 0x21) * 94 + bite - 0x21;

          // 3. Let code point be the index code point for pointer in index jis0208.
          var code_point = indexCodePointFor(pointer, index('jis0208'));

          // 4. If code point is null, return error.
          if (code_point === null)
            return decoderError(fatal);

          // 5. Return a code point whose value is code point.
          return code_point;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Set the iso-2022-jp decoder state to lead byte, prepend
          // byte to stream, and return error.
          iso2022jp_decoder_state = states.LeadByte;
          stream.prepend(bite);
          return decoderError(fatal);
        }

        // Otherwise
        // Set iso-2022-jp decoder state to lead byte and return
        // error.
        iso2022jp_decoder_state = states.LeadByte;
        return decoderError(fatal);

      case states.EscapeStart:
        // Escape start

        // 1. If byte is either 0x24 or 0x28, set iso-2022-jp lead to
        // byte, iso-2022-jp decoder state to escape, and return
        // continue.
        if (bite === 0x24 || bite === 0x28) {
          iso2022jp_lead = bite;
          iso2022jp_decoder_state = states.Escape;
          return null;
        }

        // 2. Prepend byte to stream.
        stream.prepend(bite);

        // 3. Unset the iso-2022-jp output flag, set iso-2022-jp
        // decoder state to iso-2022-jp decoder output state, and
        // return error.
        iso2022jp_output_flag = false;
        iso2022jp_decoder_state = iso2022jp_decoder_output_state;
        return decoderError(fatal);

      case states.Escape:
        // Escape

        // 1. Let lead be iso-2022-jp lead and set iso-2022-jp lead to
        // 0x00.
        var lead = iso2022jp_lead;
        iso2022jp_lead = 0x00;

        // 2. Let state be null.
        var state = null;

        // 3. If lead is 0x28 and byte is 0x42, set state to ASCII.
        if (lead === 0x28 && bite === 0x42)
          state = states.ASCII;

        // 4. If lead is 0x28 and byte is 0x4A, set state to Roman.
        if (lead === 0x28 && bite === 0x4A)
          state = states.Roman;

        // 5. If lead is 0x28 and byte is 0x49, set state to Katakana.
        if (lead === 0x28 && bite === 0x49)
          state = states.Katakana;

        // 6. If lead is 0x24 and byte is either 0x40 or 0x42, set
        // state to lead byte.
        if (lead === 0x24 && (bite === 0x40 || bite === 0x42))
          state = states.LeadByte;

        // 7. If state is non-null, run these substeps:
        if (state !== null) {
          // 1. Set iso-2022-jp decoder state and iso-2022-jp decoder
          // output state to states.
          iso2022jp_decoder_state = iso2022jp_decoder_state = state;

          // 2. Let output flag be the iso-2022-jp output flag.
          var output_flag = iso2022jp_output_flag;

          // 3. Set the iso-2022-jp output flag.
          iso2022jp_output_flag = true;

          // 4. Return continue, if output flag is unset, and error
          // otherwise.
          return !output_flag ? null : decoderError(fatal);
        }

        // 8. Prepend lead and byte to stream.
        stream.prepend([lead, bite]);

        // 9. Unset the iso-2022-jp output flag, set iso-2022-jp
        // decoder state to iso-2022-jp decoder output state and
        // return error.
        iso2022jp_output_flag = false;
        iso2022jp_decoder_state = iso2022jp_decoder_output_state;
        return decoderError(fatal);
      }
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function ISO2022JPEncoder(options) {
    var fatal = options.fatal;
    // iso-2022-jp's encoder has an associated iso-2022-jp encoder
    // state which is one of ASCII, Roman, and jis0208 (initially
    // ASCII).
    /** @enum */
    var states = {
      ASCII: 0,
      Roman: 1,
      jis0208: 2
    };
    var /** @type {number} */ iso2022jp_state = states.ASCII;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream and iso-2022-jp encoder
      // state is not ASCII, prepend code point to stream, set
      // iso-2022-jp encoder state to ASCII, and return three bytes
      // 0x1B 0x28 0x42.
      if (code_point === end_of_stream &&
          iso2022jp_state !== states.ASCII) {
        stream.prepend(code_point);
        return [0x1B, 0x28, 0x42];
      }

      // 2. If code point is end-of-stream and iso-2022-jp encoder
      // state is ASCII, return finished.
      if (code_point === end_of_stream && iso2022jp_state === states.ASCII)
        return finished;

      // 3. If iso-2022-jp encoder state is ASCII and code point is in
      // the range U+0000 to U+007F, return a byte whose value is code
      // point.
      if (iso2022jp_state === states.ASCII &&
          inRange(code_point, 0x0000, 0x007F))
        return code_point;

      // 4. If iso-2022-jp encoder state is Roman and code point is in
      // the range U+0000 to U+007F, excluding U+005C and U+007E, or
      // is U+00A5 or U+203E, run these substeps:
      if (iso2022jp_state === states.Roman &&
          inRange(code_point, 0x0000, 0x007F) &&
          code_point !== 0x005C && code_point !== 0x007E) {

        // 1. If code point is in the range U+0000 to U+007F, return a
        // byte whose value is code point.
        if (inRange(code_point, 0x0000, 0x007F))
          return code_point;

        // 2. If code point is U+00A5, return byte 0x5C.
        if (code_point === 0x00A5)
          return 0x5C;

        // 3. If code point is U+203E, return byte 0x7E.
        if (code_point === 0x203E)
          return 0x7E;
      }

      // 5. If code point is in the range U+0000 to U+007F, and
      // iso-2022-jp encoder state is not ASCII, prepend code point to
      // stream, set iso-2022-jp encoder state to ASCII, and return
      // three bytes 0x1B 0x28 0x42.
      if (inRange(code_point, 0x0000, 0x007F) &&
          iso2022jp_state !== states.ASCII) {
        stream.prepend(code_point);
        iso2022jp_state = states.ASCII;
        return [0x1B, 0x28, 0x42];
      }

      // 6. If code point is either U+00A5 or U+203E, and iso-2022-jp
      // encoder state is not Roman, prepend code point to stream, set
      // iso-2022-jp encoder state to Roman, and return three bytes
      // 0x1B 0x28 0x4A.
      if ((code_point === 0x00A5 || code_point === 0x203E) &&
          iso2022jp_state !== states.Roman) {
        stream.prepend(code_point);
        iso2022jp_state = states.Roman;
        return [0x1B, 0x28, 0x4A];
      }

      // 7. Let pointer be the index pointer for code point in index
      // jis0208.
      var pointer = indexPointerFor(code_point, index('jis0208'));

      // 8. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 9. If iso-2022-jp encoder state is not jis0208, prepend code
      // point to stream, set iso-2022-jp encoder state to jis0208,
      // and return three bytes 0x1B 0x24 0x42.
      if (iso2022jp_state !== states.jis0208) {
        stream.prepend(code_point);
        iso2022jp_state = states.jis0208;
        return [0x1B, 0x24, 0x42];
      }

      // 10. Let lead be pointer / 94 + 0x21.
      var lead = div(pointer, 94) + 0x21;

      // 11. Let trail be pointer % 94 + 0x21.
      var trail = pointer % 94 + 0x21;

      // 12. Return two bytes whose values are lead and trail.
      return [lead, trail];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['iso-2022-jp'] = function(options) {
    return new ISO2022JPEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['iso-2022-jp'] = function(options) {
    return new ISO2022JPDecoder(options);
  };

  // 12.3 shift_jis

  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function ShiftJISDecoder(options) {
    var fatal = options.fatal;
    // shift_jis's decoder has an associated shift_jis lead (initially
    // 0x00).
    var /** @type {number} */ shiftjis_lead = 0x00;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and shift_jis lead is not 0x00,
      // set shift_jis lead to 0x00 and return error.
      if (bite === end_of_stream && shiftjis_lead !== 0x00) {
        shiftjis_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and shift_jis lead is 0x00,
      // return finished.
      if (bite === end_of_stream && shiftjis_lead === 0x00)
        return finished;

      // 3. If shift_jis lead is not 0x00, let lead be shift_jis lead,
      // let pointer be null, set shift_jis lead to 0x00, and then run
      // these substeps:
      if (shiftjis_lead !== 0x00) {
        var lead = shiftjis_lead;
        var pointer = null;
        shiftjis_lead = 0x00;

        // 1. Let offset be 0x40, if byte is less than 0x7F, and 0x41
        // otherwise.
        var offset = (bite < 0x7F) ? 0x40 : 0x41;

        // 2. Let lead offset be 0x81, if lead is less than 0xA0, and
        // 0xC1 otherwise.
        var lead_offset = (lead < 0xA0) ? 0x81 : 0xC1;

        // 3. If byte is in the range 0x40 to 0x7E or 0x80 to 0xFC,
        // set pointer to (lead − lead offset) × 188 + byte − offset.
        if (inRange(bite, 0x40, 0x7E) || inRange(bite, 0x80, 0xFC))
          pointer = (lead - lead_offset) * 188 + bite - offset;

        // 4. Let code point be null, if pointer is null, and the
        // index code point for pointer in index jis0208 otherwise.
        var code_point = (pointer === null) ? null :
              indexCodePointFor(pointer, index('jis0208'));

        // 5. If code point is null and pointer is in the range 8836
        // to 10528, return a code point whose value is 0xE000 +
        // pointer − 8836.
        if (code_point === null && pointer !== null &&
            inRange(pointer, 8836, 10528))
          return 0xE000 + pointer - 8836;

        // 6. If pointer is null, prepend byte to stream.
        if (pointer === null)
          stream.prepend(bite);

        // 7. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 8. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If byte is in the range 0x00 to 0x80, return a code point
      // whose value is byte.
      if (inRange(bite, 0x00, 0x80))
        return bite;

      // 5. If byte is in the range 0xA1 to 0xDF, return a code point
      // whose value is 0xFF61 + byte − 0xA1.
      if (inRange(bite, 0xA1, 0xDF))
        return 0xFF61 + bite - 0xA1;

      // 6. If byte is in the range 0x81 to 0x9F or 0xE0 to 0xFC, set
      // shift_jis lead to byte and return continue.
      if (inRange(bite, 0x81, 0x9F) || inRange(bite, 0xE0, 0xFC)) {
        shiftjis_lead = bite;
        return null;
      }

      // 7. Return error.
      return decoderError(fatal);
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function ShiftJISEncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+0080, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x0080))
        return code_point;

      // 3. If code point is U+00A5, return byte 0x5C.
      if (code_point === 0x00A5)
        return 0x5C;

      // 4. If code point is U+203E, return byte 0x7E.
      if (code_point === 0x203E)
        return 0x7E;

      // 5. If code point is in the range U+FF61 to U+FF9F, return a
      // byte whose value is code point − 0xFF61 + 0xA1.
      if (inRange(code_point, 0xFF61, 0xFF9F))
        return code_point - 0xFF61 + 0xA1;

      // 6. Let pointer be the index shift_jis pointer for code point.
      var pointer = indexShiftJISPointerFor(code_point);

      // 7. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 8. Let lead be pointer / 188.
      var lead = div(pointer, 188);

      // 9. Let lead offset be 0x81, if lead is less than 0x1F, and
      // 0xC1 otherwise.
      var lead_offset = (lead < 0x1F) ? 0x81 : 0xC1;

      // 10. Let trail be pointer % 188.
      var trail = pointer % 188;

      // 11. Let offset be 0x40, if trail is less than 0x3F, and 0x41
      // otherwise.
      var offset = (trail < 0x3F) ? 0x40 : 0x41;

      // 12. Return two bytes whose values are lead + lead offset and
      // trail + offset.
      return [lead + lead_offset, trail + offset];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['shift_jis'] = function(options) {
    return new ShiftJISEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['shift_jis'] = function(options) {
    return new ShiftJISDecoder(options);
  };

  //
  // 13. Legacy multi-byte Korean encodings
  //

  // 13.1 euc-kr

  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function EUCKRDecoder(options) {
    var fatal = options.fatal;

    // euc-kr's decoder has an associated euc-kr lead (initially 0x00).
    var /** @type {number} */ euckr_lead = 0x00;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and euc-kr lead is not 0x00, set
      // euc-kr lead to 0x00 and return error.
      if (bite === end_of_stream && euckr_lead !== 0) {
        euckr_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and euc-kr lead is 0x00, return
      // finished.
      if (bite === end_of_stream && euckr_lead === 0)
        return finished;

      // 3. If euc-kr lead is not 0x00, let lead be euc-kr lead, let
      // pointer be null, set euc-kr lead to 0x00, and then run these
      // substeps:
      if (euckr_lead !== 0x00) {
        var lead = euckr_lead;
        var pointer = null;
        euckr_lead = 0x00;

        // 1. If byte is in the range 0x41 to 0xFE, set pointer to
        // (lead − 0x81) × 190 + (byte − 0x41).
        if (inRange(bite, 0x41, 0xFE))
          pointer = (lead - 0x81) * 190 + (bite - 0x41);

        // 2. Let code point be null, if pointer is null, and the
        // index code point for pointer in index euc-kr otherwise.
        var code_point = (pointer === null) ? null : indexCodePointFor(pointer, index('euc-kr'));

        // 3. If pointer is null and byte is in the range 0x00 to
        // 0x7F, prepend byte to stream.
        if (pointer === null && inRange(bite, 0x00, 0x7F))
          stream.prepend(bite);

        // 4. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 5. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If byte is in the range 0x00 to 0x7F, return a code point
      // whose value is byte.
      if (inRange(bite, 0x00, 0x7F))
        return bite;

      // 5. If byte is in the range 0x81 to 0xFE, set euc-kr lead to
      // byte and return continue.
      if (inRange(bite, 0x81, 0xFE)) {
        euckr_lead = bite;
        return null;
      }

      // 6. Return error.
      return decoderError(fatal);
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function EUCKREncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+007F, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x007F))
        return code_point;

      // 3. Let pointer be the index pointer for code point in index
      // euc-kr.
      var pointer = indexPointerFor(code_point, index('euc-kr'));

      // 4. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 5. Let lead be pointer / 190 + 0x81.
      var lead = div(pointer, 190) + 0x81;

      // 6. Let trail be pointer % 190 + 0x41.
      var trail = (pointer % 190) + 0x41;

      // 7. Return two bytes whose values are lead and trail.
      return [lead, trail];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['euc-kr'] = function(options) {
    return new EUCKREncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['euc-kr'] = function(options) {
    return new EUCKRDecoder(options);
  };


  //
  // 14. Legacy miscellaneous encodings
  //

  // 14.1 replacement

  // Not needed - API throws RangeError

  // 14.2 utf-16

  /**
   * @param {number} code_unit
   * @param {boolean} utf16be
   * @return {!Array.<number>} bytes
   */
  function convertCodeUnitToBytes(code_unit, utf16be) {
    // 1. Let byte1 be code unit >> 8.
    var byte1 = code_unit >> 8;

    // 2. Let byte2 be code unit & 0x00FF.
    var byte2 = code_unit & 0x00FF;

    // 3. Then return the bytes in order:
        // utf-16be flag is set: byte1, then byte2.
    if (utf16be)
      return [byte1, byte2];
    // utf-16be flag is unset: byte2, then byte1.
    return [byte2, byte1];
  }

  /**
   * @constructor
   * @implements {Decoder}
   * @param {boolean} utf16_be True if big-endian, false if little-endian.
   * @param {{fatal: boolean}} options
   */
  function UTF16Decoder(utf16_be, options) {
    var fatal = options.fatal;
    var /** @type {?number} */ utf16_lead_byte = null,
        /** @type {?number} */ utf16_lead_surrogate = null;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and either utf-16 lead byte or
      // utf-16 lead surrogate is not null, set utf-16 lead byte and
      // utf-16 lead surrogate to null, and return error.
      if (bite === end_of_stream && (utf16_lead_byte !== null ||
                                utf16_lead_surrogate !== null)) {
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and utf-16 lead byte and utf-16
      // lead surrogate are null, return finished.
      if (bite === end_of_stream && utf16_lead_byte === null &&
          utf16_lead_surrogate === null) {
        return finished;
      }

      // 3. If utf-16 lead byte is null, set utf-16 lead byte to byte
      // and return continue.
      if (utf16_lead_byte === null) {
        utf16_lead_byte = bite;
        return null;
      }

      // 4. Let code unit be the result of:
      var code_unit;
      if (utf16_be) {
        // utf-16be decoder flag is set
        //   (utf-16 lead byte << 8) + byte.
        code_unit = (utf16_lead_byte << 8) + bite;
      } else {
        // utf-16be decoder flag is unset
        //   (byte << 8) + utf-16 lead byte.
        code_unit = (bite << 8) + utf16_lead_byte;
      }
      // Then set utf-16 lead byte to null.
      utf16_lead_byte = null;

      // 5. If utf-16 lead surrogate is not null, let lead surrogate
      // be utf-16 lead surrogate, set utf-16 lead surrogate to null,
      // and then run these substeps:
      if (utf16_lead_surrogate !== null) {
        var lead_surrogate = utf16_lead_surrogate;
        utf16_lead_surrogate = null;

        // 1. If code unit is in the range U+DC00 to U+DFFF, return a
        // code point whose value is 0x10000 + ((lead surrogate −
        // 0xD800) << 10) + (code unit − 0xDC00).
        if (inRange(code_unit, 0xDC00, 0xDFFF)) {
          return 0x10000 + (lead_surrogate - 0xD800) * 0x400 +
              (code_unit - 0xDC00);
        }

        // 2. Prepend the sequence resulting of converting code unit
        // to bytes using utf-16be decoder flag to stream and return
        // error.
        stream.prepend(convertCodeUnitToBytes(code_unit, utf16_be));
        return decoderError(fatal);
      }

      // 6. If code unit is in the range U+D800 to U+DBFF, set utf-16
      // lead surrogate to code unit and return continue.
      if (inRange(code_unit, 0xD800, 0xDBFF)) {
        utf16_lead_surrogate = code_unit;
        return null;
      }

      // 7. If code unit is in the range U+DC00 to U+DFFF, return
      // error.
      if (inRange(code_unit, 0xDC00, 0xDFFF))
        return decoderError(fatal);

      // 8. Return code point code unit.
      return code_unit;
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {boolean} utf16_be True if big-endian, false if little-endian.
   * @param {{fatal: boolean}} options
   */
  function UTF16Encoder(utf16_be, options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+FFFF, return the
      // sequence resulting of converting code point to bytes using
      // utf-16be encoder flag.
      if (inRange(code_point, 0x0000, 0xFFFF))
        return convertCodeUnitToBytes(code_point, utf16_be);

      // 3. Let lead be ((code point − 0x10000) >> 10) + 0xD800,
      // converted to bytes using utf-16be encoder flag.
      var lead = convertCodeUnitToBytes(
        ((code_point - 0x10000) >> 10) + 0xD800, utf16_be);

      // 4. Let trail be ((code point − 0x10000) & 0x3FF) + 0xDC00,
      // converted to bytes using utf-16be encoder flag.
      var trail = convertCodeUnitToBytes(
        ((code_point - 0x10000) & 0x3FF) + 0xDC00, utf16_be);

      // 5. Return a byte sequence of lead followed by trail.
      return lead.concat(trail);
    };
  }

  // 14.3 utf-16be
  /** @param {{fatal: boolean}} options */
  encoders['utf-16be'] = function(options) {
    return new UTF16Encoder(true, options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['utf-16be'] = function(options) {
    return new UTF16Decoder(true, options);
  };

  // 14.4 utf-16le
  /** @param {{fatal: boolean}} options */
  encoders['utf-16le'] = function(options) {
    return new UTF16Encoder(false, options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['utf-16le'] = function(options) {
    return new UTF16Decoder(false, options);
  };

  // 14.5 x-user-defined

  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function XUserDefinedDecoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream, return finished.
      if (bite === end_of_stream)
        return finished;

      // 2. If byte is in the range 0x00 to 0x7F, return a code point
      // whose value is byte.
      if (inRange(bite, 0x00, 0x7F))
        return bite;

      // 3. Return a code point whose value is 0xF780 + byte − 0x80.
      return 0xF780 + bite - 0x80;
    };
  }

  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function XUserDefinedEncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1.If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+007F, return a
      // byte whose value is code point.
      if (inRange(code_point, 0x0000, 0x007F))
        return code_point;

      // 3. If code point is in the range U+F780 to U+F7FF, return a
      // byte whose value is code point − 0xF780 + 0x80.
      if (inRange(code_point, 0xF780, 0xF7FF))
        return code_point - 0xF780 + 0x80;

      // 4. Return error with code point.
      return encoderError(code_point);
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['x-user-defined'] = function(options) {
    return new XUserDefinedEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['x-user-defined'] = function(options) {
    return new XUserDefinedDecoder(options);
  };

  if (!('TextEncoder' in global))
    global['TextEncoder'] = TextEncoder;
  if (!('TextDecoder' in global))
    global['TextDecoder'] = TextDecoder;
}(this));

// ENCODING.JS END //

// COMMON.JS START //

(function() {

	window.WSC = {store_id:"ofhbbkphhbklhfoeikjpcbhemlocgigb"}
	WSC.DEBUG = false
	WSC.VERBOSE = false

function getchromeversion() {
    var version
    var match = navigator.userAgent.match(/Chrome\/([\d]+)/)
    if (match) {
        var version = parseInt(match[1])
    }
    return version
}
WSC.getchromeversion = getchromeversion


	WSC.maybePromise = function(maybePromiseObj, resolveFn, ctx) {
		if(maybePromiseObj && maybePromiseObj.then) {
			return maybePromiseObj.then(function(ret){ return resolveFn.call(ctx, ret); });
		} else {
			return resolveFn.call(ctx, maybePromiseObj);
		}
	}
	WSC.strformat = function(s) {
		var args = Array.prototype.slice.call(arguments,1,arguments.length);
		return s.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined'
			    ? args[number]
			    : match
			;
		});
	}
	WSC.parse_header = function(line) {
		debugger
	}
	WSC.encode_header = function(name, d) {
		if (!d) {
			return name
		}
		var out = [name]
		for (var k in d) {
			var v = d[k]
			if (! v) {
				out.push(k)
			} else {
				// quote?
				outpush(k + '=' + v)
			}
		}
		return out.join('; ')
	}

if (! String.prototype.endsWith) {
    String.prototype.endsWith = function(substr) {
        for (var i=0; i<substr.length; i++) {
            if (this[this.length - 1 - i] !== substr[substr.length - 1 - i]) {
                return false
            }
        }
        return true
    }
}
if (! String.prototype.startsWith) {
    String.prototype.startsWith = function(substr) {
        for (var i=0; i<substr.length; i++) {
            if (this[i] !== substr[i]) {
                return false
            }
        }
        return true
    }
}

// common stuff


    function EntryCache() {
        this.cache = {}
    }
    var EntryCacheprototype = {
        clearTorrent: function() {
            // todo
        },
        clearKey: function(skey) {
            var todelete = []
            for (var key in this.cache) {
                if (key.startsWith(skey)) {
                    todelete.push(key)
                }
            }
            for (var i=0; i<todelete.length; i++) {
                delete this.cache[todelete[i]]
            }
        },
        clear: function() {
            this.cache = {}
        },
        unset: function(k) {
            delete this.cache[k]
        },
        set: function(k,v) {
            this.cache[k] = {v: v};
            // Copy the last-modified date for later verification.
            if (v.lastModifiedDate) {
                this.cache[k].lastModifiedDate = v.lastModifiedDate;
            }
        },
        get: function(k) {
            if (this.cache[k]) {
                var v = this.cache[k].v;
                // If the file was modified, then the file object's last-modified date
                // will be different (greater than) the copied date. In this case the
                // file object will have stale contents so we must invalidate the cache.
                // This happens when reading files from Google Drive.
                if (v.lastModifiedDate && this.cache[k].lastModifiedDate < v.lastModifiedDate) {
                    console.log("invalidate file by lastModifiedDate");
                    this.unset(k);
                    return null;
                } else {
                    return v;
                }
            }
        }
    }
    _.extend(EntryCache.prototype, EntryCacheprototype)

    window.WSC.entryCache = new EntryCache
    window.WSC.entryFileCache = new EntryCache

WSC.recursiveGetEntry = function(filesystem, path, callback) {
    var useCache = false
    // XXX duplication with jstorrent
    var cacheKey = filesystem.filesystem.name +
        filesystem.fullPath +
        '/' + path.join('/')
    var inCache = WSC.entryCache.get(cacheKey)
    if (useCache && inCache) {
        //console.log('cache hit');
        callback(inCache); return
    }

    var state = {e:filesystem}

    function recurse(e) {
        if (path.length == 0) {
            if (e.name == 'TypeMismatchError') {
                state.e.getDirectory(state.path, {create:false}, recurse, recurse)
            } else if (e.isFile) {
                if (useCache) WSC.entryCache.set(cacheKey,e)
                callback(e)
            } else if (e.isDirectory) {
                //console.log(filesystem,path,cacheKey,state)
                if (useCache) WSC.entryCache.set(cacheKey,e)
                callback(e)
            } else {
                callback({error:'path not found'})
            }
        } else if (e.isDirectory) {
            if (path.length > 1) {
                // this is not calling error callback, simply timing out!!!
                e.getDirectory(path.shift(), {create:false}, recurse, recurse)
            } else {
                state.e = e
                state.path = _.clone(path)
                e.getFile(path.shift(), {create:false}, recurse, recurse)
            }
        } else if (e.name == 'NotFoundError') {
            callback({error:e.name, message:e.message})
        } else {
            callback({error:'file exists'})
        }
    }
    recurse(filesystem)
}

WSC.parseHeaders = function(lines) {
    var headers = {}
    var line
    // TODO - multi line headers?
    for (var i=0;i<lines.length;i++) {
        line = lines[i]
        var j = line.indexOf(':')
        headers[ line.slice(0,j).toLowerCase() ] = line.slice(j+1,line.length).trim()
    }
    return headers
}
function ui82str(arr, startOffset) {
    console.assert(arr)
    if (! startOffset) { startOffset = 0 }
    var length = arr.length - startOffset // XXX a few random exceptions here
    var str = ""
    for (var i=0; i<length; i++) {
        str += String.fromCharCode(arr[i + startOffset])
    }
    return str
}
function ui82arr(arr, startOffset) {
    if (! startOffset) { startOffset = 0 }
    var length = arr.length - startOffset
    var outarr = []
    for (var i=0; i<length; i++) {
        outarr.push(arr[i + startOffset])
    }
    return outarr
}
function str2ab(s) {
    var arr = []
    for (var i=0; i<s.length; i++) {
        arr.push(s.charCodeAt(i))
    }
    return new Uint8Array(arr).buffer
}
    WSC.ui82str = ui82str
WSC.str2ab = str2ab
    WSC.stringToUint8Array = function(string) {
        var encoder = new TextEncoder()
        return encoder.encode(string)
    };

    WSC.arrayBufferToString = function(buffer) {
        var decoder = new TextDecoder()
        return decoder.decode(buffer)
    };
/*
    var logToScreen = function(log) {
        logger.textContent += log + "\n";
    }
*/

function parseUri(str) {
    return new URL(str) // can throw exception, watch out!
}


WSC.parseUri = parseUri


})();

// COMMON.JS END //


// MIME.JS START //

(function() {
var MIMETYPES = {
  "123": "application/vnd.lotus-1-2-3",
  "3dml": "text/vnd.in3d.3dml",
  "3ds": "image/x-3ds",
  "3g2": "video/3gpp2",
  "3gp": "video/3gpp",
  "7z": "application/x-7z-compressed",
  "aab": "application/x-authorware-bin",
  "aac": "audio/x-aac",
  "aam": "application/x-authorware-map",
  "aas": "application/x-authorware-seg",
  "abw": "application/x-abiword",
  "ac": "application/pkix-attr-cert",
  "acc": "application/vnd.americandynamics.acc",
  "ace": "application/x-ace-compressed",
  "acu": "application/vnd.acucobol",
  "acutc": "application/vnd.acucorp",
  "adp": "audio/adpcm",
  "aep": "application/vnd.audiograph",
  "afm": "application/x-font-type1",
  "afp": "application/vnd.ibm.modcap",
  "ahead": "application/vnd.ahead.space",
  "ai": "application/postscript",
  "aif": "audio/x-aiff",
  "aifc": "audio/x-aiff",
  "aiff": "audio/x-aiff",
  "air": "application/vnd.adobe.air-application-installer-package+zip",
  "ait": "application/vnd.dvb.ait",
  "ami": "application/vnd.amiga.ami",
  "apk": "application/vnd.android.package-archive",
  "appcache": "text/cache-manifest",
  "application": "application/x-ms-application",
  "apr": "application/vnd.lotus-approach",
  "arc": "application/x-freearc",
  "asc": "application/pgp-signature",
  "asf": "video/x-ms-asf",
  "asm": "text/x-asm",
  "aso": "application/vnd.accpac.simply.aso",
  "asx": "video/x-ms-asf",
  "atc": "application/vnd.acucorp",
  "atom": "application/atom+xml",
  "atomcat": "application/atomcat+xml",
  "atomsvc": "application/atomsvc+xml",
  "atx": "application/vnd.antix.game-component",
  "au": "audio/basic",
  "avi": "video/x-msvideo",
  "aw": "application/applixware",
  "azf": "application/vnd.airzip.filesecure.azf",
  "azs": "application/vnd.airzip.filesecure.azs",
  "azw": "application/vnd.amazon.ebook",
  "bat": "application/x-msdownload",
  "bcpio": "application/x-bcpio",
  "bdf": "application/x-font-bdf",
  "bdm": "application/vnd.syncml.dm+wbxml",
  "bed": "application/vnd.realvnc.bed",
  "bh2": "application/vnd.fujitsu.oasysprs",
  "bin": "application/octet-stream",
  "blb": "application/x-blorb",
  "blorb": "application/x-blorb",
  "bmi": "application/vnd.bmi",
  "bmp": "image/bmp",
  "book": "application/vnd.framemaker",
  "box": "application/vnd.previewsystems.box",
  "boz": "application/x-bzip2",
  "bpk": "application/octet-stream",
  "btif": "image/prs.btif",
  "bz": "application/x-bzip",
  "bz2": "application/x-bzip2",
  "c": "text/x-c",
  "c11amc": "application/vnd.cluetrust.cartomobile-config",
  "c11amz": "application/vnd.cluetrust.cartomobile-config-pkg",
  "c4d": "application/vnd.clonk.c4group",
  "c4f": "application/vnd.clonk.c4group",
  "c4g": "application/vnd.clonk.c4group",
  "c4p": "application/vnd.clonk.c4group",
  "c4u": "application/vnd.clonk.c4group",
  "cab": "application/vnd.ms-cab-compressed",
  "caf": "audio/x-caf",
  "cap": "application/vnd.tcpdump.pcap",
  "car": "application/vnd.curl.car",
  "cat": "application/vnd.ms-pki.seccat",
  "cb7": "application/x-cbr",
  "cba": "application/x-cbr",
  "cbr": "application/x-cbr",
  "cbt": "application/x-cbr",
  "cbz": "application/x-cbr",
  "cc": "text/x-c",
  "cct": "application/x-director",
  "ccxml": "application/ccxml+xml",
  "cdbcmsg": "application/vnd.contact.cmsg",
  "cdf": "application/x-netcdf",
  "cdkey": "application/vnd.mediastation.cdkey",
  "cdmia": "application/cdmi-capability",
  "cdmic": "application/cdmi-container",
  "cdmid": "application/cdmi-domain",
  "cdmio": "application/cdmi-object",
  "cdmiq": "application/cdmi-queue",
  "cdx": "chemical/x-cdx",
  "cdxml": "application/vnd.chemdraw+xml",
  "cdy": "application/vnd.cinderella",
  "cer": "application/pkix-cert",
  "cfs": "application/x-cfs-compressed",
  "cgm": "image/cgm",
  "chat": "application/x-chat",
  "chm": "application/vnd.ms-htmlhelp",
  "chrt": "application/vnd.kde.kchart",
  "cif": "chemical/x-cif",
  "cii": "application/vnd.anser-web-certificate-issue-initiation",
  "cil": "application/vnd.ms-artgalry",
  "cla": "application/vnd.claymore",
  "class": "application/java-vm",
  "clkk": "application/vnd.crick.clicker.keyboard",
  "clkp": "application/vnd.crick.clicker.palette",
  "clkt": "application/vnd.crick.clicker.template",
  "clkw": "application/vnd.crick.clicker.wordbank",
  "clkx": "application/vnd.crick.clicker",
  "clp": "application/x-msclip",
  "cmc": "application/vnd.cosmocaller",
  "cmdf": "chemical/x-cmdf",
  "cml": "chemical/x-cml",
  "cmp": "application/vnd.yellowriver-custom-menu",
  "cmx": "image/x-cmx",
  "cod": "application/vnd.rim.cod",
  "com": "application/x-msdownload",
  "conf": "text/plain",
  "cpio": "application/x-cpio",
  "cpp": "text/x-c",
  "cpt": "application/mac-compactpro",
  "crd": "application/x-mscardfile",
  "crl": "application/pkix-crl",
  "crt": "application/x-x509-ca-cert",
  "cryptonote": "application/vnd.rig.cryptonote",
  "csh": "application/x-csh",
  "csml": "chemical/x-csml",
  "csp": "application/vnd.commonspace",
  "css": "text/css",
  "cst": "application/x-director",
  "csv": "text/csv",
  "cu": "application/cu-seeme",
  "curl": "text/vnd.curl",
  "cww": "application/prs.cww",
  "cxt": "application/x-director",
  "cxx": "text/x-c",
  "dae": "model/vnd.collada+xml",
  "daf": "application/vnd.mobius.daf",
  "dart": "application/vnd.dart",
  "dataless": "application/vnd.fdsn.seed",
  "davmount": "application/davmount+xml",
  "dbk": "application/docbook+xml",
  "dcr": "application/x-director",
  "dcurl": "text/vnd.curl.dcurl",
  "dd2": "application/vnd.oma.dd2+xml",
  "ddd": "application/vnd.fujixerox.ddd",
  "deb": "application/x-debian-package",
  "def": "text/plain",
  "deploy": "application/octet-stream",
  "der": "application/x-x509-ca-cert",
  "dfac": "application/vnd.dreamfactory",
  "dgc": "application/x-dgc-compressed",
  "dic": "text/x-c",
  "dir": "application/x-director",
  "dis": "application/vnd.mobius.dis",
  "dist": "application/octet-stream",
  "distz": "application/octet-stream",
  "djv": "image/vnd.djvu",
  "djvu": "image/vnd.djvu",
  "dll": "application/x-msdownload",
  "dmg": "application/x-apple-diskimage",
  "dmp": "application/vnd.tcpdump.pcap",
  "dms": "application/octet-stream",
  "dna": "application/vnd.dna",
  "doc": "application/msword",
  "docm": "application/vnd.ms-word.document.macroenabled.12",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "dot": "application/msword",
  "dotm": "application/vnd.ms-word.template.macroenabled.12",
  "dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  "dp": "application/vnd.osgi.dp",
  "dpg": "application/vnd.dpgraph",
  "dra": "audio/vnd.dra",
  "dsc": "text/prs.lines.tag",
  "dssc": "application/dssc+der",
  "dtb": "application/x-dtbook+xml",
  "dtd": "application/xml-dtd",
  "dts": "audio/vnd.dts",
  "dtshd": "audio/vnd.dts.hd",
  "dump": "application/octet-stream",
  "dvb": "video/vnd.dvb.file",
  "dvi": "application/x-dvi",
  "dwf": "model/vnd.dwf",
  "dwg": "image/vnd.dwg",
  "dxf": "image/vnd.dxf",
  "dxp": "application/vnd.spotfire.dxp",
  "dxr": "application/x-director",
  "ecelp4800": "audio/vnd.nuera.ecelp4800",
  "ecelp7470": "audio/vnd.nuera.ecelp7470",
  "ecelp9600": "audio/vnd.nuera.ecelp9600",
  "ecma": "application/ecmascript",
  "edm": "application/vnd.novadigm.edm",
  "edx": "application/vnd.novadigm.edx",
  "efif": "application/vnd.picsel",
  "ei6": "application/vnd.pg.osasli",
  "elc": "application/octet-stream",
  "emf": "application/x-msmetafile",
  "eml": "message/rfc822",
  "emma": "application/emma+xml",
  "emz": "application/x-msmetafile",
  "eol": "audio/vnd.digital-winds",
  "eot": "application/vnd.ms-fontobject",
  "eps": "application/postscript",
  "epub": "application/epub+zip",
  "es3": "application/vnd.eszigno3+xml",
  "esa": "application/vnd.osgi.subsystem",
  "esf": "application/vnd.epson.esf",
  "et3": "application/vnd.eszigno3+xml",
  "etx": "text/x-setext",
  "eva": "application/x-eva",
  "evy": "application/x-envoy",
  "exe": "application/x-msdownload",
  "exi": "application/exi",
  "ext": "application/vnd.novadigm.ext",
  "ez": "application/andrew-inset",
  "ez2": "application/vnd.ezpix-album",
  "ez3": "application/vnd.ezpix-package",
  "f": "text/x-fortran",
  "f4v": "video/x-f4v",
  "f77": "text/x-fortran",
  "f90": "text/x-fortran",
  "fbs": "image/vnd.fastbidsheet",
  "fcdt": "application/vnd.adobe.formscentral.fcdt",
  "fcs": "application/vnd.isac.fcs",
  "fdf": "application/vnd.fdf",
  "fe_launch": "application/vnd.denovo.fcselayout-link",
  "fg5": "application/vnd.fujitsu.oasysgp",
  "fgd": "application/x-director",
  "fh": "image/x-freehand",
  "fh4": "image/x-freehand",
  "fh5": "image/x-freehand",
  "fh7": "image/x-freehand",
  "fhc": "image/x-freehand",
  "fig": "application/x-xfig",
  "flac": "audio/x-flac",
  "fli": "video/x-fli",
  "flo": "application/vnd.micrografx.flo",
  "flv": "video/x-flv",
  "flw": "application/vnd.kde.kivio",
  "flx": "text/vnd.fmi.flexstor",
  "fly": "text/vnd.fly",
  "fm": "application/vnd.framemaker",
  "fnc": "application/vnd.frogans.fnc",
  "for": "text/x-fortran",
  "fpx": "image/vnd.fpx",
  "frame": "application/vnd.framemaker",
  "fsc": "application/vnd.fsc.weblaunch",
  "fst": "image/vnd.fst",
  "ftc": "application/vnd.fluxtime.clip",
  "fti": "application/vnd.anser-web-funds-transfer-initiation",
  "fvt": "video/vnd.fvt",
  "fxp": "application/vnd.adobe.fxp",
  "fxpl": "application/vnd.adobe.fxp",
  "fzs": "application/vnd.fuzzysheet",
  "g2w": "application/vnd.geoplan",
  "g3": "image/g3fax",
  "g3w": "application/vnd.geospace",
  "gac": "application/vnd.groove-account",
  "gam": "application/x-tads",
  "gbr": "application/rpki-ghostbusters",
  "gca": "application/x-gca-compressed",
  "gdl": "model/vnd.gdl",
  "geo": "application/vnd.dynageo",
  "gex": "application/vnd.geometry-explorer",
  "ggb": "application/vnd.geogebra.file",
  "ggt": "application/vnd.geogebra.tool",
  "ghf": "application/vnd.groove-help",
  "gif": "image/gif",
  "gim": "application/vnd.groove-identity-message",
  "gml": "application/gml+xml",
  "gmx": "application/vnd.gmx",
  "gnumeric": "application/x-gnumeric",
  "gph": "application/vnd.flographit",
  "gpx": "application/gpx+xml",
  "gqf": "application/vnd.grafeq",
  "gqs": "application/vnd.grafeq",
  "gram": "application/srgs",
  "gramps": "application/x-gramps-xml",
  "gre": "application/vnd.geometry-explorer",
  "grv": "application/vnd.groove-injector",
  "grxml": "application/srgs+xml",
  "gsf": "application/x-font-ghostscript",
  "gtar": "application/x-gtar",
  "gtm": "application/vnd.groove-tool-message",
  "gtw": "model/vnd.gtw",
  "gv": "text/vnd.graphviz",
  "gxf": "application/gxf",
  "gxt": "application/vnd.geonext",
  "h": "text/x-c",
  "h261": "video/h261",
  "h263": "video/h263",
  "h264": "video/h264",
  "hal": "application/vnd.hal+xml",
  "hbci": "application/vnd.hbci",
  "hdf": "application/x-hdf",
  "hh": "text/x-c",
  "hlp": "application/winhlp",
  "hpgl": "application/vnd.hp-hpgl",
  "hpid": "application/vnd.hp-hpid",
  "hps": "application/vnd.hp-hps",
  "hqx": "application/mac-binhex40",
  "htke": "application/vnd.kenameaapp",
  "htm": "text/html",
  "html": "text/html",
  "hvd": "application/vnd.yamaha.hv-dic",
  "hvp": "application/vnd.yamaha.hv-voice",
  "hvs": "application/vnd.yamaha.hv-script",
  "i2g": "application/vnd.intergeo",
  "icc": "application/vnd.iccprofile",
  "ice": "x-conference/x-cooltalk",
  "icm": "application/vnd.iccprofile",
  "ico": "image/x-icon",
  "ics": "text/calendar",
  "ief": "image/ief",
  "ifb": "text/calendar",
  "ifm": "application/vnd.shana.informed.formdata",
  "iges": "model/iges",
  "igl": "application/vnd.igloader",
  "igm": "application/vnd.insors.igm",
  "igs": "model/iges",
  "igx": "application/vnd.micrografx.igx",
  "iif": "application/vnd.shana.informed.interchange",
  "imp": "application/vnd.accpac.simply.imp",
  "ims": "application/vnd.ms-ims",
  "in": "text/plain",
  "ink": "application/inkml+xml",
  "inkml": "application/inkml+xml",
  "install": "application/x-install-instructions",
  "iota": "application/vnd.astraea-software.iota",
  "ipfix": "application/ipfix",
  "ipk": "application/vnd.shana.informed.package",
  "irm": "application/vnd.ibm.rights-management",
  "irp": "application/vnd.irepository.package+xml",
  "iso": "application/x-iso9660-image",
  "itp": "application/vnd.shana.informed.formtemplate",
  "ivp": "application/vnd.immervision-ivp",
  "ivu": "application/vnd.immervision-ivu",
  "jad": "text/vnd.sun.j2me.app-descriptor",
  "jam": "application/vnd.jam",
  "jar": "application/java-archive",
  "java": "text/x-java-source",
  "jisp": "application/vnd.jisp",
  "jlt": "application/vnd.hp-jlyt",
  "jnlp": "application/x-java-jnlp-file",
  "joda": "application/vnd.joost.joda-archive",
  "jpe": "image/jpeg",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "jpgm": "video/jpm",
  "jpgv": "video/jpeg",
  "jpm": "video/jpm",
  "js": "application/javascript",
  "json": "application/json",
  "jsonml": "application/jsonml+json",
  "kar": "audio/midi",
  "karbon": "application/vnd.kde.karbon",
  "kfo": "application/vnd.kde.kformula",
  "kia": "application/vnd.kidspiration",
  "kml": "application/vnd.google-earth.kml+xml",
  "kmz": "application/vnd.google-earth.kmz",
  "kne": "application/vnd.kinar",
  "knp": "application/vnd.kinar",
  "kon": "application/vnd.kde.kontour",
  "kpr": "application/vnd.kde.kpresenter",
  "kpt": "application/vnd.kde.kpresenter",
  "kpxx": "application/vnd.ds-keypoint",
  "ksp": "application/vnd.kde.kspread",
  "ktr": "application/vnd.kahootz",
  "ktx": "image/ktx",
  "ktz": "application/vnd.kahootz",
  "kwd": "application/vnd.kde.kword",
  "kwt": "application/vnd.kde.kword",
  "lasxml": "application/vnd.las.las+xml",
  "latex": "application/x-latex",
  "lbd": "application/vnd.llamagraphics.life-balance.desktop",
  "lbe": "application/vnd.llamagraphics.life-balance.exchange+xml",
  "les": "application/vnd.hhe.lesson-player",
  "lha": "application/x-lzh-compressed",
  "link66": "application/vnd.route66.link66+xml",
  "list": "text/plain",
  "list3820": "application/vnd.ibm.modcap",
  "listafp": "application/vnd.ibm.modcap",
  "lnk": "application/x-ms-shortcut",
  "log": "text/plain",
  "lostxml": "application/lost+xml",
  "lrf": "application/octet-stream",
  "lrm": "application/vnd.ms-lrm",
  "ltf": "application/vnd.frogans.ltf",
  "lvp": "audio/vnd.lucent.voice",
  "lwp": "application/vnd.lotus-wordpro",
  "lzh": "application/x-lzh-compressed",
  "m13": "application/x-msmediaview",
  "m14": "application/x-msmediaview",
  "m1v": "video/mpeg",
  "m21": "application/mp21",
  "m2a": "audio/mpeg",
  "m2v": "video/mpeg",
  "m3a": "audio/mpeg",
  "m3u": "audio/x-mpegurl",
  "m3u8": "application/vnd.apple.mpegurl",
  "m4u": "video/vnd.mpegurl",
  "m4v": "video/x-m4v",
  "ma": "application/mathematica",
  "mads": "application/mads+xml",
  "mag": "application/vnd.ecowin.chart",
  "maker": "application/vnd.framemaker",
  "man": "text/troff",
  "mar": "application/octet-stream",
  "mathml": "application/mathml+xml",
  "mb": "application/mathematica",
  "mbk": "application/vnd.mobius.mbk",
  "mbox": "application/mbox",
  "mc1": "application/vnd.medcalcdata",
  "mcd": "application/vnd.mcd",
  "mcurl": "text/vnd.curl.mcurl",
  "mdb": "application/x-msaccess",
  "mdi": "image/vnd.ms-modi",
  "me": "text/troff",
  "mesh": "model/mesh",
  "meta4": "application/metalink4+xml",
  "metalink": "application/metalink+xml",
  "mets": "application/mets+xml",
  "mfm": "application/vnd.mfmp",
  "mft": "application/rpki-manifest",
  "mgp": "application/vnd.osgeo.mapguide.package",
  "mgz": "application/vnd.proteus.magazine",
  "mid": "audio/midi",
  "midi": "audio/midi",
  "mie": "application/x-mie",
  "mif": "application/vnd.mif",
  "mime": "message/rfc822",
  "mj2": "video/mj2",
  "mjp2": "video/mj2",
  "mk3d": "video/x-matroska",
  "mka": "audio/x-matroska",
  "mks": "video/x-matroska",
  "mkv": "video/x-matroska",
  "mlp": "application/vnd.dolby.mlp",
  "mmd": "application/vnd.chipnuts.karaoke-mmd",
  "mmf": "application/vnd.smaf",
  "mmr": "image/vnd.fujixerox.edmics-mmr",
  "mng": "video/x-mng",
  "mny": "application/x-msmoney",
  "mobi": "application/x-mobipocket-ebook",
  "mods": "application/mods+xml",
  "mov": "video/quicktime",
  "movie": "video/x-sgi-movie",
  "mp2": "audio/mpeg",
  "mp21": "application/mp21",
  "mp2a": "audio/mpeg",
  "mp3": "audio/mpeg",
  "mp4": "video/mp4",
  "mp4a": "audio/mp4",
  "mp4s": "application/mp4",
  "mp4v": "video/mp4",
  "mpc": "application/vnd.mophun.certificate",
  "mpe": "video/mpeg",
  "mpeg": "video/mpeg",
  "mpg": "video/mpeg",
  "mpg4": "video/mp4",
  "mpga": "audio/mpeg",
  "mpkg": "application/vnd.apple.installer+xml",
  "mpm": "application/vnd.blueice.multipass",
  "mpn": "application/vnd.mophun.application",
  "mpp": "application/vnd.ms-project",
  "mpt": "application/vnd.ms-project",
  "mpy": "application/vnd.ibm.minipay",
  "mqy": "application/vnd.mobius.mqy",
  "mrc": "application/marc",
  "mrcx": "application/marcxml+xml",
  "ms": "text/troff",
  "mscml": "application/mediaservercontrol+xml",
  "mseed": "application/vnd.fdsn.mseed",
  "mseq": "application/vnd.mseq",
  "msf": "application/vnd.epson.msf",
  "msh": "model/mesh",
  "msi": "application/x-msdownload",
  "msl": "application/vnd.mobius.msl",
  "msty": "application/vnd.muvee.style",
  "mts": "model/vnd.mts",
  "mus": "application/vnd.musician",
  "musicxml": "application/vnd.recordare.musicxml+xml",
  "mvb": "application/x-msmediaview",
  "mwf": "application/vnd.mfer",
  "mxf": "application/mxf",
  "mxl": "application/vnd.recordare.musicxml",
  "mxml": "application/xv+xml",
  "mxs": "application/vnd.triscape.mxs",
  "mxu": "video/vnd.mpegurl",
  "n-gage": "application/vnd.nokia.n-gage.symbian.install",
  "n3": "text/n3",
  "nb": "application/mathematica",
  "nbp": "application/vnd.wolfram.player",
  "nc": "application/x-netcdf",
  "ncx": "application/x-dtbncx+xml",
  "nfo": "text/x-nfo",
  "ngdat": "application/vnd.nokia.n-gage.data",
  "nitf": "application/vnd.nitf",
  "nlu": "application/vnd.neurolanguage.nlu",
  "nml": "application/vnd.enliven",
  "nnd": "application/vnd.noblenet-directory",
  "nns": "application/vnd.noblenet-sealer",
  "nnw": "application/vnd.noblenet-web",
  "npx": "image/vnd.net-fpx",
  "nsc": "application/x-conference",
  "nsf": "application/vnd.lotus-notes",
  "ntf": "application/vnd.nitf",
  "nzb": "application/x-nzb",
  "oa2": "application/vnd.fujitsu.oasys2",
  "oa3": "application/vnd.fujitsu.oasys3",
  "oas": "application/vnd.fujitsu.oasys",
  "obd": "application/x-msbinder",
  "obj": "application/x-tgif",
  "oda": "application/oda",
  "odb": "application/vnd.oasis.opendocument.database",
  "odc": "application/vnd.oasis.opendocument.chart",
  "odf": "application/vnd.oasis.opendocument.formula",
  "odft": "application/vnd.oasis.opendocument.formula-template",
  "odg": "application/vnd.oasis.opendocument.graphics",
  "odi": "application/vnd.oasis.opendocument.image",
  "odm": "application/vnd.oasis.opendocument.text-master",
  "odp": "application/vnd.oasis.opendocument.presentation",
  "ods": "application/vnd.oasis.opendocument.spreadsheet",
  "odt": "application/vnd.oasis.opendocument.text",
  "oga": "audio/ogg",
  "ogg": "audio/ogg",
  "ogv": "video/ogg",
  "ogx": "application/ogg",
  "omdoc": "application/omdoc+xml",
  "onepkg": "application/onenote",
  "onetmp": "application/onenote",
  "onetoc": "application/onenote",
  "onetoc2": "application/onenote",
  "opf": "application/oebps-package+xml",
  "opml": "text/x-opml",
  "oprc": "application/vnd.palm",
  "org": "application/vnd.lotus-organizer",
  "osf": "application/vnd.yamaha.openscoreformat",
  "osfpvg": "application/vnd.yamaha.openscoreformat.osfpvg+xml",
  "otc": "application/vnd.oasis.opendocument.chart-template",
  "otf": "application/x-font-otf",
  "otg": "application/vnd.oasis.opendocument.graphics-template",
  "oth": "application/vnd.oasis.opendocument.text-web",
  "oti": "application/vnd.oasis.opendocument.image-template",
  "otp": "application/vnd.oasis.opendocument.presentation-template",
  "ots": "application/vnd.oasis.opendocument.spreadsheet-template",
  "ott": "application/vnd.oasis.opendocument.text-template",
  "oxps": "application/oxps",
  "oxt": "application/vnd.openofficeorg.extension",
  "p": "text/x-pascal",
  "p10": "application/pkcs10",
  "p12": "application/x-pkcs12",
  "p7b": "application/x-pkcs7-certificates",
  "p7c": "application/pkcs7-mime",
  "p7m": "application/pkcs7-mime",
  "p7r": "application/x-pkcs7-certreqresp",
  "p7s": "application/pkcs7-signature",
  "p8": "application/pkcs8",
  "pas": "text/x-pascal",
  "paw": "application/vnd.pawaafile",
  "pbd": "application/vnd.powerbuilder6",
  "pbm": "image/x-portable-bitmap",
  "pcap": "application/vnd.tcpdump.pcap",
  "pcf": "application/x-font-pcf",
  "pcl": "application/vnd.hp-pcl",
  "pclxl": "application/vnd.hp-pclxl",
  "pct": "image/x-pict",
  "pcurl": "application/vnd.curl.pcurl",
  "pcx": "image/x-pcx",
  "pdb": "application/vnd.palm",
  "pdf": "application/pdf",
  "pfa": "application/x-font-type1",
  "pfb": "application/x-font-type1",
  "pfm": "application/x-font-type1",
  "pfr": "application/font-tdpfr",
  "pfx": "application/x-pkcs12",
  "pgm": "image/x-portable-graymap",
  "pgn": "application/x-chess-pgn",
  "pgp": "application/pgp-encrypted",
  "pic": "image/x-pict",
  "pkg": "application/octet-stream",
  "pki": "application/pkixcmp",
  "pkipath": "application/pkix-pkipath",
  "plb": "application/vnd.3gpp.pic-bw-large",
  "plc": "application/vnd.mobius.plc",
  "plf": "application/vnd.pocketlearn",
  "pls": "application/pls+xml",
  "pml": "application/vnd.ctc-posml",
  "png": "image/png",
  "pnm": "image/x-portable-anymap",
  "portpkg": "application/vnd.macports.portpkg",
  "pot": "application/vnd.ms-powerpoint",
  "potm": "application/vnd.ms-powerpoint.template.macroenabled.12",
  "potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
  "ppam": "application/vnd.ms-powerpoint.addin.macroenabled.12",
  "ppd": "application/vnd.cups-ppd",
  "ppm": "image/x-portable-pixmap",
  "pps": "application/vnd.ms-powerpoint",
  "ppsm": "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
  "ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "ppt": "application/vnd.ms-powerpoint",
  "pptm": "application/vnd.ms-powerpoint.presentation.macroenabled.12",
  "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "pqa": "application/vnd.palm",
  "prc": "application/x-mobipocket-ebook",
  "pre": "application/vnd.lotus-freelance",
  "prf": "application/pics-rules",
  "ps": "application/postscript",
  "psb": "application/vnd.3gpp.pic-bw-small",
  "psd": "image/vnd.adobe.photoshop",
  "psf": "application/x-font-linux-psf",
  "pskcxml": "application/pskc+xml",
  "ptid": "application/vnd.pvi.ptid1",
  "pub": "application/x-mspublisher",
  "pvb": "application/vnd.3gpp.pic-bw-var",
  "pwn": "application/vnd.3m.post-it-notes",
  "pya": "audio/vnd.ms-playready.media.pya",
  "pyv": "video/vnd.ms-playready.media.pyv",
  "qam": "application/vnd.epson.quickanime",
  "qbo": "application/vnd.intu.qbo",
  "qfx": "application/vnd.intu.qfx",
  "qps": "application/vnd.publishare-delta-tree",
  "qt": "video/quicktime",
  "qwd": "application/vnd.quark.quarkxpress",
  "qwt": "application/vnd.quark.quarkxpress",
  "qxb": "application/vnd.quark.quarkxpress",
  "qxd": "application/vnd.quark.quarkxpress",
  "qxl": "application/vnd.quark.quarkxpress",
  "qxt": "application/vnd.quark.quarkxpress",
  "ra": "audio/x-pn-realaudio",
  "ram": "audio/x-pn-realaudio",
  "rar": "application/x-rar-compressed",
  "ras": "image/x-cmu-raster",
  "rcprofile": "application/vnd.ipunplugged.rcprofile",
  "rdf": "application/rdf+xml",
  "rdz": "application/vnd.data-vision.rdz",
  "rep": "application/vnd.businessobjects",
  "res": "application/x-dtbresource+xml",
  "rgb": "image/x-rgb",
  "rif": "application/reginfo+xml",
  "rip": "audio/vnd.rip",
  "ris": "application/x-research-info-systems",
  "rl": "application/resource-lists+xml",
  "rlc": "image/vnd.fujixerox.edmics-rlc",
  "rld": "application/resource-lists-diff+xml",
  "rm": "application/vnd.rn-realmedia",
  "rmi": "audio/midi",
  "rmp": "audio/x-pn-realaudio-plugin",
  "rms": "application/vnd.jcp.javame.midlet-rms",
  "rmvb": "application/vnd.rn-realmedia-vbr",
  "rnc": "application/relax-ng-compact-syntax",
  "roa": "application/rpki-roa",
  "roff": "text/troff",
  "rp9": "application/vnd.cloanto.rp9",
  "rpss": "application/vnd.nokia.radio-presets",
  "rpst": "application/vnd.nokia.radio-preset",
  "rq": "application/sparql-query",
  "rs": "application/rls-services+xml",
  "rsd": "application/rsd+xml",
  "rss": "application/rss+xml",
  "rtf": "application/rtf",
  "rtx": "text/richtext",
  "s": "text/x-asm",
  "s3m": "audio/s3m",
  "saf": "application/vnd.yamaha.smaf-audio",
  "sbml": "application/sbml+xml",
  "sc": "application/vnd.ibm.secure-container",
  "scd": "application/x-msschedule",
  "scm": "application/vnd.lotus-screencam",
  "scq": "application/scvp-cv-request",
  "scs": "application/scvp-cv-response",
  "scurl": "text/vnd.curl.scurl",
  "sda": "application/vnd.stardivision.draw",
  "sdc": "application/vnd.stardivision.calc",
  "sdd": "application/vnd.stardivision.impress",
  "sdkd": "application/vnd.solent.sdkm+xml",
  "sdkm": "application/vnd.solent.sdkm+xml",
  "sdp": "application/sdp",
  "sdw": "application/vnd.stardivision.writer",
  "see": "application/vnd.seemail",
  "seed": "application/vnd.fdsn.seed",
  "sema": "application/vnd.sema",
  "semd": "application/vnd.semd",
  "semf": "application/vnd.semf",
  "ser": "application/java-serialized-object",
  "setpay": "application/set-payment-initiation",
  "setreg": "application/set-registration-initiation",
  "sfd-hdstx": "application/vnd.hydrostatix.sof-data",
  "sfs": "application/vnd.spotfire.sfs",
  "sfv": "text/x-sfv",
  "sgi": "image/sgi",
  "sgl": "application/vnd.stardivision.writer-global",
  "sgm": "text/sgml",
  "sgml": "text/sgml",
  "sh": "application/x-sh",
  "shar": "application/x-shar",
  "shf": "application/shf+xml",
  "sid": "image/x-mrsid-image",
  "sig": "application/pgp-signature",
  "sil": "audio/silk",
  "silo": "model/mesh",
  "sis": "application/vnd.symbian.install",
  "sisx": "application/vnd.symbian.install",
  "sit": "application/x-stuffit",
  "sitx": "application/x-stuffitx",
  "skd": "application/vnd.koan",
  "skm": "application/vnd.koan",
  "skp": "application/vnd.koan",
  "skt": "application/vnd.koan",
  "sldm": "application/vnd.ms-powerpoint.slide.macroenabled.12",
  "sldx": "application/vnd.openxmlformats-officedocument.presentationml.slide",
  "slt": "application/vnd.epson.salt",
  "sm": "application/vnd.stepmania.stepchart",
  "smf": "application/vnd.stardivision.math",
  "smi": "application/smil+xml",
  "smil": "application/smil+xml",
  "smv": "video/x-smv",
  "smzip": "application/vnd.stepmania.package",
  "snd": "audio/basic",
  "snf": "application/x-font-snf",
  "so": "application/octet-stream",
  "spc": "application/x-pkcs7-certificates",
  "spf": "application/vnd.yamaha.smaf-phrase",
  "spl": "application/x-futuresplash",
  "spot": "text/vnd.in3d.spot",
  "spp": "application/scvp-vp-response",
  "spq": "application/scvp-vp-request",
  "spx": "audio/ogg",
  "sql": "application/x-sql",
  "src": "application/x-wais-source",
  "srt": "application/x-subrip",
  "sru": "application/sru+xml",
  "srx": "application/sparql-results+xml",
  "ssdl": "application/ssdl+xml",
  "sse": "application/vnd.kodak-descriptor",
  "ssf": "application/vnd.epson.ssf",
  "ssml": "application/ssml+xml",
  "st": "application/vnd.sailingtracker.track",
  "stc": "application/vnd.sun.xml.calc.template",
  "std": "application/vnd.sun.xml.draw.template",
  "stf": "application/vnd.wt.stf",
  "sti": "application/vnd.sun.xml.impress.template",
  "stk": "application/hyperstudio",
  "stl": "application/vnd.ms-pki.stl",
  "str": "application/vnd.pg.format",
  "stw": "application/vnd.sun.xml.writer.template",
  "sub": "text/vnd.dvb.subtitle",
  "sus": "application/vnd.sus-calendar",
  "susp": "application/vnd.sus-calendar",
  "sv4cpio": "application/x-sv4cpio",
  "sv4crc": "application/x-sv4crc",
  "svc": "application/vnd.dvb.service",
  "svd": "application/vnd.svd",
  "svg": "image/svg+xml",
  "svgz": "image/svg+xml",
  "swa": "application/x-director",
  "swf": "application/x-shockwave-flash",
  "swi": "application/vnd.aristanetworks.swi",
  "sxc": "application/vnd.sun.xml.calc",
  "sxd": "application/vnd.sun.xml.draw",
  "sxg": "application/vnd.sun.xml.writer.global",
  "sxi": "application/vnd.sun.xml.impress",
  "sxm": "application/vnd.sun.xml.math",
  "sxw": "application/vnd.sun.xml.writer",
  "t": "text/troff",
  "t3": "application/x-t3vm-image",
  "taglet": "application/vnd.mynfc",
  "tao": "application/vnd.tao.intent-module-archive",
  "tar": "application/x-tar",
  "tcap": "application/vnd.3gpp2.tcap",
  "tcl": "application/x-tcl",
  "teacher": "application/vnd.smart.teacher",
  "tei": "application/tei+xml",
  "teicorpus": "application/tei+xml",
  "tex": "application/x-tex",
  "texi": "application/x-texinfo",
  "texinfo": "application/x-texinfo",
  "text": "text/plain",
  "tfi": "application/thraud+xml",
  "tfm": "application/x-tex-tfm",
  "tga": "image/x-tga",
  "thmx": "application/vnd.ms-officetheme",
  "tif": "image/tiff",
  "tiff": "image/tiff",
  "tmo": "application/vnd.tmobile-livetv",
  "torrent": "application/x-bittorrent",
  "tpl": "application/vnd.groove-tool-template",
  "tpt": "application/vnd.trid.tpt",
  "tr": "text/troff",
  "tra": "application/vnd.trueapp",
  "trm": "application/x-msterminal",
  "tsd": "application/timestamped-data",
  "tsv": "text/tab-separated-values",
  "ttc": "application/x-font-ttf",
  "ttf": "application/x-font-ttf",
  "ttl": "text/turtle",
  "twd": "application/vnd.simtech-mindmapper",
  "twds": "application/vnd.simtech-mindmapper",
  "txd": "application/vnd.genomatix.tuxedo",
  "txf": "application/vnd.mobius.txf",
  "txt": "text/plain",
  "u32": "application/x-authorware-bin",
  "udeb": "application/x-debian-package",
  "ufd": "application/vnd.ufdl",
  "ufdl": "application/vnd.ufdl",
  "ulx": "application/x-glulx",
  "umj": "application/vnd.umajin",
  "unityweb": "application/vnd.unity",
  "uoml": "application/vnd.uoml+xml",
  "uri": "text/uri-list",
  "uris": "text/uri-list",
  "urls": "text/uri-list",
  "ustar": "application/x-ustar",
  "utz": "application/vnd.uiq.theme",
  "uu": "text/x-uuencode",
  "uva": "audio/vnd.dece.audio",
  "uvd": "application/vnd.dece.data",
  "uvf": "application/vnd.dece.data",
  "uvg": "image/vnd.dece.graphic",
  "uvh": "video/vnd.dece.hd",
  "uvi": "image/vnd.dece.graphic",
  "uvm": "video/vnd.dece.mobile",
  "uvp": "video/vnd.dece.pd",
  "uvs": "video/vnd.dece.sd",
  "uvt": "application/vnd.dece.ttml+xml",
  "uvu": "video/vnd.uvvu.mp4",
  "uvv": "video/vnd.dece.video",
  "uvva": "audio/vnd.dece.audio",
  "uvvd": "application/vnd.dece.data",
  "uvvf": "application/vnd.dece.data",
  "uvvg": "image/vnd.dece.graphic",
  "uvvh": "video/vnd.dece.hd",
  "uvvi": "image/vnd.dece.graphic",
  "uvvm": "video/vnd.dece.mobile",
  "uvvp": "video/vnd.dece.pd",
  "uvvs": "video/vnd.dece.sd",
  "uvvt": "application/vnd.dece.ttml+xml",
  "uvvu": "video/vnd.uvvu.mp4",
  "uvvv": "video/vnd.dece.video",
  "uvvx": "application/vnd.dece.unspecified",
  "uvvz": "application/vnd.dece.zip",
  "uvx": "application/vnd.dece.unspecified",
  "uvz": "application/vnd.dece.zip",
  "vcard": "text/vcard",
  "vcd": "application/x-cdlink",
  "vcf": "text/x-vcard",
  "vcg": "application/vnd.groove-vcard",
  "vcs": "text/x-vcalendar",
  "vcx": "application/vnd.vcx",
  "vis": "application/vnd.visionary",
  "viv": "video/vnd.vivo",
  "vob": "video/x-ms-vob",
  "vor": "application/vnd.stardivision.writer",
  "vox": "application/x-authorware-bin",
  "vrml": "model/vrml",
  "vsd": "application/vnd.visio",
  "vsf": "application/vnd.vsf",
  "vss": "application/vnd.visio",
  "vst": "application/vnd.visio",
  "vsw": "application/vnd.visio",
  "vtu": "model/vnd.vtu",
  "vtt": "text/vtt",
  "vxml": "application/voicexml+xml",
  "w3d": "application/x-director",
  "wad": "application/x-doom",
  "wav": "audio/x-wav",
  "wax": "audio/x-ms-wax",
  "wbmp": "image/vnd.wap.wbmp",
  "wbs": "application/vnd.criticaltools.wbs+xml",
  "wbxml": "application/vnd.wap.wbxml",
  "wcm": "application/vnd.ms-works",
  "wdb": "application/vnd.ms-works",
  "wdp": "image/vnd.ms-photo",
  "weba": "audio/webm",
  "webm": "video/webm",
  "webp": "image/webp",
  "wg": "application/vnd.pmi.widget",
  "wgt": "application/widget",
  "wks": "application/vnd.ms-works",
  "wm": "video/x-ms-wm",
  "wma": "audio/x-ms-wma",
  "wmd": "application/x-ms-wmd",
  "wmf": "application/x-msmetafile",
  "wml": "text/vnd.wap.wml",
  "wmlc": "application/vnd.wap.wmlc",
  "wmls": "text/vnd.wap.wmlscript",
  "wmlsc": "application/vnd.wap.wmlscriptc",
  "wmv": "video/x-ms-wmv",
  "wmx": "video/x-ms-wmx",
  "wmz": "application/x-msmetafile",
  "woff": "application/x-font-woff",
  "wpd": "application/vnd.wordperfect",
  "wpl": "application/vnd.ms-wpl",
  "wps": "application/vnd.ms-works",
  "wqd": "application/vnd.wqd",
  "wri": "application/x-mswrite",
  "wrl": "model/vrml",
  "wsdl": "application/wsdl+xml",
  "wspolicy": "application/wspolicy+xml",
  "wtb": "application/vnd.webturbo",
  "wvx": "video/x-ms-wvx",
  "x32": "application/x-authorware-bin",
  "x3d": "model/x3d+xml",
  "x3db": "model/x3d+binary",
  "x3dbz": "model/x3d+binary",
  "x3dv": "model/x3d+vrml",
  "x3dvz": "model/x3d+vrml",
  "x3dz": "model/x3d+xml",
  "xaml": "application/xaml+xml",
  "xap": "application/x-silverlight-app",
  "xar": "application/vnd.xara",
  "xbap": "application/x-ms-xbap",
  "xbd": "application/vnd.fujixerox.docuworks.binder",
  "xbm": "image/x-xbitmap",
  "xdf": "application/xcap-diff+xml",
  "xdm": "application/vnd.syncml.dm+xml",
  "xdp": "application/vnd.adobe.xdp+xml",
  "xdssc": "application/dssc+xml",
  "xdw": "application/vnd.fujixerox.docuworks",
  "xenc": "application/xenc+xml",
  "xer": "application/patch-ops-error+xml",
  "xfdf": "application/vnd.adobe.xfdf",
  "xfdl": "application/vnd.xfdl",
  "xht": "application/xhtml+xml",
  "xhtml": "application/xhtml+xml",
  "xhvml": "application/xv+xml",
  "xif": "image/vnd.xiff",
  "xla": "application/vnd.ms-excel",
  "xlam": "application/vnd.ms-excel.addin.macroenabled.12",
  "xlc": "application/vnd.ms-excel",
  "xlf": "application/x-xliff+xml",
  "xlm": "application/vnd.ms-excel",
  "xls": "application/vnd.ms-excel",
  "xlsb": "application/vnd.ms-excel.sheet.binary.macroenabled.12",
  "xlsm": "application/vnd.ms-excel.sheet.macroenabled.12",
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "xlt": "application/vnd.ms-excel",
  "xltm": "application/vnd.ms-excel.template.macroenabled.12",
  "xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "xlw": "application/vnd.ms-excel",
  "xm": "audio/xm",
  "xml": "application/xml",
  "xo": "application/vnd.olpc-sugar",
  "xop": "application/xop+xml",
  "xpi": "application/x-xpinstall",
  "xpl": "application/xproc+xml",
  "xpm": "image/x-xpixmap",
  "xpr": "application/vnd.is-xpr",
  "xps": "application/vnd.ms-xpsdocument",
  "xpw": "application/vnd.intercon.formnet",
  "xpx": "application/vnd.intercon.formnet",
  "xsl": "application/xml",
  "xslt": "application/xslt+xml",
  "xsm": "application/vnd.syncml+xml",
  "xspf": "application/xspf+xml",
  "xul": "application/vnd.mozilla.xul+xml",
  "xvm": "application/xv+xml",
  "xvml": "application/xv+xml",
  "xwd": "image/x-xwindowdump",
  "xyz": "chemical/x-xyz",
  "xz": "application/x-xz",
  "yang": "application/yang",
  "yin": "application/yin+xml",
  "z1": "application/x-zmachine",
  "z2": "application/x-zmachine",
  "z3": "application/x-zmachine",
  "z4": "application/x-zmachine",
  "z5": "application/x-zmachine",
  "z6": "application/x-zmachine",
  "z7": "application/x-zmachine",
  "z8": "application/x-zmachine",
  "zaz": "application/vnd.zzazz.deck+xml",
  "zip": "application/zip",
  "zir": "application/vnd.zul",
  "zirz": "application/vnd.zul",
  "zmm": "application/vnd.handheld-entertainment+xml"
};
var MIMECATEGORIES = {'video':[],'audio':[]}
for (var key in MIMETYPES) {
    if (MIMETYPES[key].startsWith('video/')) {
        MIMECATEGORIES['video'].push( key )
    } else if (MIMETYPES[key].startsWith('audio/')) {
        MIMECATEGORIES['audio'].push( key )
    }
}
WSC.MIMECATEGORIES = MIMECATEGORIES
WSC.MIMETYPES = MIMETYPES
})();

// MIME.JS END //

// BUFFER.JS START //

(function() {
function Buffer(opts) {
    /*
      FIFO queue type that lets you check when able to consume the
      right amount of data.
     */
    this.opts = opts
    this.max_buffer_size = 104857600
    this._size = 0
    this.deque = []
}

Buffer.prototype = {
    clear: function() {
        this.deque = []
        this._size = 0
    },
    flatten: function() {
        if (this.deque.length == 1) { return this.deque[0] }
        // flattens the buffer deque to one element
        var totalSz = 0
        for (var i=0; i<this.deque.length; i++) {
            totalSz += this.deque[i].byteLength
        }
        var arr = new Uint8Array(totalSz)
        var idx = 0
        for (var i=0; i<this.deque.length; i++) {
            arr.set(new Uint8Array(this.deque[i]), idx)
            idx += this.deque[i].byteLength
        }
        this.deque = [arr.buffer]
        return arr.buffer
    },
    add: function(data) {
        console.assert(data instanceof ArrayBuffer)
		//console.assert(data.byteLength > 0)
        this._size = this._size + data.byteLength
        this.deque.push(data)
    },
    consume_any_max: function(maxsz) {
        if (this.size() <= maxsz) {
            return this.consume(this.size())
        } else {
            return this.consume(maxsz)
        }
    },
    consume: function(sz,putback) {
        // returns a single array buffer of size sz
        if (sz > this._size) {
            console.assert(false)
            return false
        }

        var consumed = 0

        var ret = new Uint8Array(sz)
        var curbuf
        // consume from the left

        while (consumed < sz) {
            curbuf = this.deque[0]
            console.assert(curbuf instanceof ArrayBuffer)

            if (consumed + curbuf.byteLength <= sz) {
                // curbuf fits in completely to return buffer
                ret.set( new Uint8Array(curbuf), consumed )
                consumed = consumed + curbuf.byteLength
                this.deque.shift()
            } else {
                // curbuf too big! this will be the last buffer
                var sliceleft = new Uint8Array( curbuf, 0, sz - consumed )
                //console.log('left slice',sliceleft)

                ret.set( sliceleft, consumed )
                // we spliced off data, so set curbuf in deque

                var remainsz = curbuf.byteLength - (sz - consumed)
                var sliceright = new Uint8Array(curbuf, sz - consumed, remainsz)
                //console.log('right slice',sliceright)
                var remain = new Uint8Array(remainsz)
                remain.set(sliceright, 0)
                //console.log('right slice (newbuf)',remain)

                this.deque[0] = remain.buffer
                break
            }
        }
        if (putback) {
            this.deque = [ret.buffer].concat(this.deque)
        } else {
            this._size -= sz
        }
        return ret.buffer
    },
    size: function() {
        return this._size
    }
}


function test_buffer() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    console.assert( b.size() == 4 )
    b.add( new Uint8Array([5,6,7]).buffer )
    console.assert( b.size() == 7 )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    console.assert( b.size() == 12 )
    var data

    data = b.consume(1);
    console.assert(new Uint8Array(data)[0] == 1)
    console.assert( data.byteLength == 1 )

    data = b.consume(1);
    console.assert(new Uint8Array(data)[0] == 2)
    console.assert( data.byteLength == 1 )

    data = b.consume(2);
    console.assert( data.byteLength == 2 )
    console.assert(new Uint8Array(data)[0] == 3)
    console.assert(new Uint8Array(data)[1] == 4)
}

function test_buffer2() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    console.assert( b.size() == 4 )
    b.add( new Uint8Array([5,6,7]).buffer )
    console.assert( b.size() == 7 )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    console.assert( b.size() == 12 )
    var data

    data = b.consume(6);
    var adata = new Uint8Array(data)
    console.assert(data.byteLength == 6)
    console.assert(adata[0] == 1)
    console.assert(adata[1] == 2)
    console.assert(adata[2] == 3)
    console.assert(adata[3] == 4)
    console.assert(adata[4] == 5)
    console.assert(adata[5] == 6)
}

function test_buffer3() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume_any_max(1024);
    var adata = new Uint8Array(data)
    console.assert(data.byteLength == 12)
    for (var i=0;i<12;i++) {
        console.assert(adata[i] == i+1)
    }
}

function test_buffer4() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume_any_max(10);
    var adata = new Uint8Array(data)
    console.assert(data.byteLength == 10)
    for (var i=0;i<10;i++) {
        console.assert(adata[i] == i+1)
    }
}


if (false) {
    test_buffer()
    test_buffer2()
    test_buffer3()
    test_buffer4()
}
WSC.Buffer = Buffer
})();

// BUFFER.JS END //

// REQUEST.JS START //

(function() {
    function HTTPRequest(opts) {
        this.method = opts.method
        this.uri = opts.uri
        this.version = opts.version
        this.connection = opts.connection
        this.headers = opts.headers
        this.body = null
        this.bodyparams = null

        this.arguments = {}
        var idx = this.uri.indexOf('?')
        if (idx != -1) {
            this.path = decodeURIComponent(this.uri.slice(0,idx))
            var s = this.uri.slice(idx+1)
            var parts = s.split('&')

            for (var i=0; i<parts.length; i++) {
                var p = parts[i]
                var idx2 = p.indexOf('=')
                this.arguments[decodeURIComponent(p.slice(0,idx2))] = decodeURIComponent(p.slice(idx2+1,s.length))
            }
        } else {
            this.path = decodeURIComponent(this.uri)
        }

        this.origpath = this.path

        if (this.path[this.path.length-1] == '/') {
            this.path = this.path.slice(0,this.path.length-1)
        }

    }

    HTTPRequest.prototype = {
        isKeepAlive: function() {
            return this.headers['connection'] && this.headers['connection'].toLowerCase() != 'close'
        }
    }

    WSC.HTTPRequest = HTTPRequest
})();

// REQUEST.JS END //

// STREAM.JS START //

(function() {

    var peerSockMap = {}
    WSC.peerSockMap = peerSockMap

    function onTCPReceive(info) {
        var sockId = info.socketId
        if (WSC.peerSockMap[sockId]) {
            WSC.peerSockMap[sockId].onReadTCP(info)
        }
    }

    chrome.sockets.tcp.onReceive.addListener( onTCPReceive )
    chrome.sockets.tcp.onReceiveError.addListener( onTCPReceive )

    var sockets = chrome.sockets
    function IOStream(sockId) {
        this.sockId = sockId
        peerSockMap[this.sockId] = this
        this.readCallback = null
        this.readUntilDelimiter = null
        this.readBuffer = new WSC.Buffer
        this.writeBuffer = new WSC.Buffer
        this.writing = false
        this.pleaseReadBytes = null

        this.remoteclosed = false
        this.closed = false
        this.connected = true

        this.halfclose = null
        this.onclose = null
        this.ondata = null
        this.source = null
        this._close_callbacks = []

        this.onWriteBufferEmpty = null
        chrome.sockets.tcp.setPaused(this.sockId, false, this.onUnpaused.bind(this))
    }

    IOStream.prototype = {
		set_close_callback: function(fn) {
			this._close_callbacks = [fn]
		},
		set_nodelay: function() {
			chrome.sockets.tcp.setNoDelay(this.sockId, true, function(){})
		},
        removeHandler: function() {
            delete peerSockMap[this.sockId]
        },
        addCloseCallback: function(cb) {
            this._close_callbacks.push(cb)
        },
        peekstr: function(maxlen) {
            return WSC.ui82str(new Uint8Array(this.readBuffer.deque[0], 0, maxlen))
        },
        removeCloseCallback: function(cb) {
            debugger
        },
        runCloseCallbacks: function() {
            for (var i=0; i<this._close_callbacks.length; i++) {
                this._close_callbacks[i](this)
            }
            if (this.onclose) { this.onclose() }
        },
        onUnpaused: function(info) {
            var lasterr = chrome.runtime.lastError
            if (lasterr) {
                this.close('set unpause fail')
            }
            //console.log('sock unpaused',info)
        },
        readUntil: function(delimiter, callback) {
            this.readUntilDelimiter = delimiter
            this.readCallback = callback
            this.checkBuffer()
        },
        readBytes: function(numBytes, callback) {
            this.pleaseReadBytes = numBytes
            this.readCallback = callback
            this.checkBuffer()
        },
        tryWrite: function(callback) {
            if (this.writing) {
                //console.warn('already writing..');
                return
            }
            if (this.closed) {
                console.warn(this.sockId,'cant write, closed');
                return
            }
            //console.log('tryWrite')
            this.writing = true
            var data = this.writeBuffer.consume_any_max(4096)
            //console.log(this.sockId,'tcp.send',data.byteLength)
            //console.log(this.sockId,'tcp.send',WSC.ui82str(new Uint8Array(data)))
            sockets.tcp.send( this.sockId, data, this.onWrite.bind(this, callback) )
        },
		write: function(data) {
			this.writeBuffer.add(data)
			this.tryWrite()
		},
        onWrite: function(callback, evt) {
            var err = chrome.runtime.lastError
            if (err) {
                //console.log('socket.send lastError',err)
                //this.tryClose()
                this.close('writeerr'+err)
                return
            }

            // look at evt!
            if (evt.bytesWritten <= 0) {
                //console.log('onwrite fail, closing',evt)
                this.close('writerr<0')
                return
            }
            this.writing = false
            if (this.writeBuffer.size() > 0) {
                //console.log('write more...')
                if (this.closed) {
                } else {
                    this.tryWrite(callback)
                }
            } else {
                if (this.onWriteBufferEmpty) { this.onWriteBufferEmpty(); }
            }
        },
        onReadTCP: function(evt) {
            var lasterr = chrome.runtime.lastError
            if (lasterr) {
                this.close('read tcp lasterr'+lasterr)
                return
            }
            //console.log('onRead',WSC.ui82str(new Uint8Array(evt.data)))
            if (evt.resultCode == 0) {
                //this.error({message:'remote closed connection'})
                this.log('remote closed connection (halfduplex)')
                this.remoteclosed = true
                if (this.halfclose) { this.halfclose() }
                if (this.request) {
                    // do we even have a request yet? or like what to do ...
                }
            } else if (evt.resultCode < 0) {
                this.log('remote killed connection',evt.resultCode)
                this.error({message:'error code',errno:evt.resultCode})
            } else {
                this.readBuffer.add(evt.data)
                if (this.onread) { this.onread() }
                this.checkBuffer()
            }
        },
        log: function(msg,msg2,msg3) {
			if (WSC.VERBOSE) {
				console.log(this.sockId,msg,msg2,msg3)
			}
        },
        checkBuffer: function() {
            //console.log('checkBuffer')
            if (this.readUntilDelimiter) {
                var buf = this.readBuffer.flatten()
                var str = WSC.arrayBufferToString(buf)
                var idx = str.indexOf(this.readUntilDelimiter)
                if (idx != -1) {
                    var callback = this.readCallback
                    var toret = this.readBuffer.consume(idx+this.readUntilDelimiter.length)
                    this.readUntilDelimiter = null
                    this.readCallback = null
                    callback(toret)
                }
            } else if (this.pleaseReadBytes !== null) {
                if (this.readBuffer.size() >= this.pleaseReadBytes) {
                    var data = this.readBuffer.consume(this.pleaseReadBytes)
                    var callback = this.readCallback
                    this.readCallback = null
                    this.pleaseReadBytes = null
                    callback(data)
                }
            }
        },
        close: function(reason) {
			if ( this.closed) { return }
            this.connected = false
            this.closed = true
            this.runCloseCallbacks()
            //console.log('tcp sock close',this.sockId)
            delete peerSockMap[this.sockId]
            sockets.tcp.close(this.sockId, this.onClosed.bind(this,reason))
            //this.sockId = null
            this.cleanup()
        },
        onClosed: function(reason, info) {
            var lasterr = chrome.runtime.lastError
            if (lasterr) {
                console.log('onClosed',reason,lasterr,info)
            } else {
                //console.log('onClosed',reason,info)
            }
        },
        error: function(data) {
            console.warn(this.sockId,'closed')
            //console.error(this,data)
            // try close by writing 0 bytes
            if (! this.closed) {
                this.close()
            }
        },
        checkedCallback: function(callback) {
            var err = chrome.runtime.lastError;
            if (err) {
                console.warn('socket callback lastError',err,callback)
            }
        },
        tryClose: function(callback) {
            if (!callback) { callback=this.checkedCallback }
            if (! this.closed) {
                console.warn('cant close, already closed')
                this.cleanup()
                return
            }
            console.log(this.sockId,'tryClose')
            sockets.tcp.send(this.sockId, new ArrayBuffer, callback)
        },
        cleanup: function() {
            this.writeBuffer = new WSC.Buffer
        }
    }

    WSC.IOStream = IOStream;

})();

// STREAM.JS END //

// CONNECTION.JS START //

(function() {
    _DEBUG = false
    function HTTPConnection(stream) {
        this.stream = stream
        this.curRequest = null
        this.onRequestCallback = null
        //this.log('new connection')
        this.closed = false
    }

    HTTPConnection.prototype = {
        log: function(msg) {
            console.log(this.stream.sockId,msg)
        },
        tryRead: function() {
            this.stream.readUntil('\r\n\r\n',this.onHeaders.bind(this))
        },
        write: function(data) {
            if (typeof data == 'string') {
                // this is using TextEncoder with utf-8
                var buf = WSC.stringToUint8Array(data).buffer
            } else {
                var buf = data
            }
            this.stream.writeBuffer.add(buf)
            this.stream.tryWrite()
        },
        close: function() {
            console.log('http conn close')
            this.closed = true
            this.stream.close()
        },
        addRequestCallback: function(cb) {
            this.onRequestCallback = cb
        },
        onHeaders: function(data) {
            // TODO - http headers are Latin1, not ascii...
            var datastr = WSC.arrayBufferToString(data)
            var lines = datastr.split('\r\n')
            var firstline = lines[0]
            var flparts = firstline.split(' ')
            var method = flparts[0]
            var uri = flparts[1]
            var version = flparts[2]

            var headers = WSC.parseHeaders(lines.slice(1,lines.length-2))
            this.curRequest = new WSC.HTTPRequest({headers:headers,
                                           method:method,
                                           uri:uri,
                                           version:version,
                                                   connection:this})
            if (_DEBUG) {
                this.log(this.curRequest.uri)
            }
            if (headers['content-length']) {
                var clen = parseInt(headers['content-length'])
                // TODO -- handle 100 continue..
                if (clen > 0) {
                    console.log('request had content length',clen)
                    this.stream.readBytes(clen, this.onRequestBody.bind(this))
                    return
                } else {
                    this.curRequest.body = null
                }
            }


            if (method == 'GET') {
                this.onRequest(this.curRequest)
            } else if (method == 'HEAD') {
                this.onRequest(this.curRequest)
            } else if (method == 'PUT') {
                // handle request BODY?
                this.onRequest(this.curRequest)
            } else {
                console.error('how to handle',this.curRequest)
            }
        },
        onRequestBody: function(body) {
            var req = this.curRequest
            var ct = req.headers['content-type']
            var default_charset = 'utf-8'
            if (ct) {
                ct = ct.toLowerCase()
                if (ct.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
                    var charset_i = ct.indexOf('charset=')
                    if (charset_i != -1) {
                        var charset = ct.slice(charset_i + 'charset='.length,
                                               ct.length)
                        console.log('using charset',charset)
                    } else {
                        var charset = default_charset
                    }

                    var bodydata = new TextDecoder(charset).decode(body)
                    var bodyparams = {}
                    var items = bodydata.split('&')
                    for (var i=0; i<items.length; i++) {
                        var kv = items[i].split('=')
                        bodyparams[ decodeURIComponent(kv[0]) ] = decodeURIComponent(kv[1])
                    }
                    req.bodyparams = bodyparams
                }
            }
            this.curRequest.body = body
            this.onRequest(this.curRequest)
        },
        onRequest: function(request) {
            this.onRequestCallback(request)
        }
    }

    WSC.HTTPConnection = HTTPConnection;

})();

// CONNECTION.JS END //

// WEBAPP.JS START //

(function(){
    var sockets = chrome.sockets

    function WebApplication(opts) {
        // need to support creating multiple WebApplication...
        if (WSC.DEBUG) {
            console.log('initialize webapp with opts',opts)
        }
        opts = opts || {}
        this.id = Math.random().toString()
        this.opts = opts
        this.handlers = opts.handlers || []
        this.init_handlers()
        this.sockInfo = null
        this.lasterr = null
        this.stopped = false
        this.starting = false
        this.start_callback = null
        this._stop_callback = null
        this.started = false
        this.fs = null
        this.streams = {}
        this.upnp = null
        if (opts.retainstr) {
            // special option to setup a handler
            chrome.fileSystem.restoreEntry( opts.retainstr, function(entry) {
                if (entry) {
                    this.on_entry(entry)
                } else {
                    this.error('error setting up retained entry')
                }
            }.bind(this))
        }
        if (opts.entry) {
            this.on_entry(opts.entry)
        }
        this.host = this.get_host()
        this.port = parseInt(opts.port || 8887)

        this._idle_timeout_id = null

        this.on_status_change = null
        this.interfaces = []
        this.interface_retry_count = 0
        this.urls = []
        this.extra_urls = []
        if (this.port > 65535 || this.port < 1024) {
            var err = 'bad port: ' + this.port
            this.error(err)
        }
        this.acceptQueue = []
    }

    WebApplication.prototype = {
        processAcceptQueue: function() {
            console.log('process accept queue len',this.acceptQueue.length)
            while (this.acceptQueue.length > 0) {
                var sockInfo = this.acceptQueue.shift()
                this.onAccept(sockInfo)
            }
        },
        updateOption: function(k,v) {
            this.opts[k] = v
            switch(k) {
            case 'optDoPortMapping':
                if (! v) {
                    if (this.upnp) {
                        this.upnp.removeMapping(this.port, 'TCP', function(result) {
                            console.log('result of removing port mapping',result)
                            this.extra_urls = []
                            this.upnp = null
                            //this.init_urls() // misleading because active connections are not terminated
                            //this.change()
                        }.bind(this))
                    }
                }
                break
            }
        },
        get_info: function() {
            return {
                interfaces: this.interfaces,
                urls: this.urls,
                opts: this.opts,
                started: this.started,
                starting: this.starting,
                stopped: this.stopped,
                lasterr: this.lasterr
            }
        },
        updatedSleepSetting: function() {
            if (! this.started) {
                chrome.power.releaseKeepAwake()
                return
            }
            if (this.opts.optPreventSleep) {
                console.log('requesting keep awake system')
                chrome.power.requestKeepAwake(chrome.power.Level.SYSTEM)
            } else {
                console.log('releasing keep awake system')
                chrome.power.releaseKeepAwake()
            }
        },
        on_entry: function(entry) {
            var fs = new WSC.FileSystem(entry)
            this.fs = fs
            this.add_handler(['.*',WSC.DirectoryEntryHandler.bind(null, fs)])
            this.init_handlers()
            if (WSC.DEBUG) {
                //console.log('setup handler for entry',entry)
            }
            //if (this.opts.optBackground) { this.start() }
        },
        get_host: function() {
            var host
            if (WSC.getchromeversion() >= 44 && this.opts.optAllInterfaces) {
                if (this.opts.optIPV6) {
                    host = this.opts.host || '::'
                } else {
                    host = this.opts.host || '0.0.0.0'
                }
            } else {
                host = this.opts.host || '127.0.0.1'
            }
            return host
        },
        add_handler: function(handler) {
            this.handlers.push(handler)
        },
        init_handlers: function() {
            this.handlersMatch = []
            for (var i=0; i<this.handlers.length; i++) {
                var repat = this.handlers[i][0]
                this.handlersMatch.push( [new RegExp(repat), this.handlers[i][1]] )
            }
            this.change()
        },
        change: function() {
            if (this.on_status_change) { this.on_status_change() }
        },
        start_success: function(data) {
            if (this.opts.optPreventSleep) {
                console.log('requesting keep awake system')
                chrome.power.requestKeepAwake(chrome.power.Level.SYSTEM)
            }
            var callback = this.start_callback
            this.start_callback = null
            this.registerIdle()
            if (callback) {
                callback(this.get_info())
            }
            this.change()
        },
        error: function(data) {
            if (this.opts.optPreventSleep) {
                chrome.power.releaseKeepAwake()
            }
            this.interface_retry_count=0
            var callback = this.start_callback
            this.starting = false
            this.stopped = true
            this.start_callback = null
            console.error('webapp error:',data)
            this.lasterr = data
            this.change()
            if (callback) {
                callback({error:data})
            }
        },
        stop: function(reason, callback) {
            this.lasterr = ''
            this.urls = []
            this.change()
            if (callback) { this._stop_callback = callback }
            console.log('webserver stop:',reason)
            if (this.starting) {
                console.error('cant stop, currently starting')
                return
            }
            this.clearIdle()

            if (true || this.opts.optPreventSleep) {
                if (WSC.VERBOSE)
                    console.log('trying release keep awake')
				if (chrome.power)
					chrome.power.releaseKeepAwake()
            }
            // TODO: remove hidden.html ensureFirewallOpen
            // also - support multiple instances.

            if (! this.started) {
                // already stopped, trying to double stop
                console.warn('webserver already stopped...')
                this.change()
                return
            }

            this.started = false
            this.stopped = true
            chrome.sockets.tcpServer.disconnect(this.sockInfo.socketId, this.onDisconnect.bind(this, reason))
            for (var key in this.streams) {
                this.streams[key].close()
            }
            this.change()
            // also disconnect any open connections...
        },
        onClose: function(reason, info) {
            var err = chrome.runtime.lastError
            if (err) { console.warn(err) }
            this.stopped = true
            this.started = false
            if (this._stop_callback) {
                this._stop_callback(reason)
            }
            if (WSC.VERBOSE)
                console.log('tcpserver onclose',info)
        },
        onDisconnect: function(reason, info) {
            var err = chrome.runtime.lastError
            if (err) { console.warn(err) }
            this.stopped = true
            this.started = false
            if (WSC.VERBOSE)
                console.log('tcpserver ondisconnect',info)
            if (this.sockInfo) {
                chrome.sockets.tcpServer.close(this.sockInfo.socketId, this.onClose.bind(this, reason))
            }
        },
        onStreamClose: function(stream) {
            console.assert(stream.sockId)
            if (this.opts.optStopIdleServer) {
                for (var key in this.streams) {
                    this.registerIdle()
                    break;
                }
            }
            delete this.streams[stream.sockId]
        },
        clearIdle: function() {
            if (WSC.VERBOSE)
                console.log('clearIdle')
            if (this._idle_timeout_id) {
                clearTimeout(this._idle_timeout_id)
                this._idle_timeout_id = null
            }
        },
        registerIdle: function() {
            if (this.opts.optStopIdleServer) {
                console.log('registerIdle')
                this._idle_timeout_id = setTimeout( this.checkIdle.bind(this), this.opts.optStopIdleServer )
            }
        },
        checkIdle: function() {
            if (this.opts.optStopIdleServer) {
                if (WSC.VERBOSE)
                    console.log('checkIdle')
                for (var key in this.streams) {
                    console.log('hit checkIdle, but had streams. returning')
                    return
                }
                this.stop('idle')
            }
        },
        start: function(callback) {
            this.lasterr = null
            /*
            if (clear_urls === undefined) { clear_urls = true }
            if (clear_urls) {
                this.urls = []
            }*/
            if (this.starting || this.started) {
                console.error("already starting or started")
                return
            }
            this.start_callback = callback
            this.stopped = false
            this.starting = true
            this.change()

            // need to setup some things
            if (this.interfaces.length == 0 && this.opts.optAllInterfaces) {
                this.getInterfaces({interface_retry_count:0}, this.startOnInterfaces.bind(this))
            } else {
                this.startOnInterfaces()
            }
        },
        startOnInterfaces: function() {
            // this.interfaces should be populated now (or could be empty, but we tried!)
            this.tryListenOnPort({port_attempts:0}, this.onListenPortReady.bind(this))
        },
        onListenPortReady: function(info) {
            if (info.error) {
                this.error(info)
            } else {
                if (WSC.VERBOSE)
                    console.log('listen port ready',info)
                this.port = info.port
                if (this.opts.optAllInterfaces && this.opts.optDoPortMapping) {
                    console.clog("WSC","doing port mapping")
                    this.upnp = new WSC.UPNP({port:this.port,udp:false,searchtime:2000})
                    this.upnp.reset(this.onPortmapResult.bind(this))
                } else {
                    this.onReady()
                }
            }
        },
        onPortmapResult: function(result) {
            var gateway = this.upnp.validGateway
            console.log('portmap result',result,gateway)
			if (result && ! result.error) {
				if (gateway.device && gateway.device.externalIP) {
					var extIP = gateway.device.externalIP
					this.extra_urls = [{url:'http://'+extIP+':' + this.port}]
				}
			}
            this.onReady()
        },
        onReady: function() {
            this.ensureFirewallOpen()
            //console.log('onListen',result)
            this.starting = false
            this.started = true
            console.log('Listening on','http://'+ this.get_host() + ':' + this.port+'/')
            this.bindAcceptCallbacks()
            this.init_urls()
            this.start_success({urls:this.urls}) // initialize URLs ?
        },
        init_urls: function() {
            this.urls = [].concat(this.extra_urls)
            this.urls.push({url:'http://127.0.0.1:' + this.port})
            for (var i=0; i<this.interfaces.length; i++) {
                var iface = this.interfaces[i]
                if (iface.prefixLength > 24) {
                    this.urls.push({url:'http://['+iface.address+']:' + this.port})
                } else {
                    this.urls.push({url:'http://'+iface.address+':' + this.port})
                }
            }
            return this.urls
        },
        computePortRetry: function(i) {
            return this.port + i*3 + Math.pow(i,2)*2
        },
        tryListenOnPort: function(state, callback) {
            sockets.tcpServer.getSockets( function(sockets) {
                if (sockets.length == 0) {
                    this.doTryListenOnPort(state, callback)
                } else {
                    var match = sockets.filter( function(s) { return s.name == 'WSCListenSocket' } )
                    if (match && match.length == 1) {
                        var m = match[0]
                        console.log('adopting existing persistent socket',m)
                        this.sockInfo = m
                        this.port = m.localPort
                        callback({port:m.localPort})
						return
                    }
					this.doTryListenOnPort(state, callback)
                }
            }.bind(this))
        },
        doTryListenOnPort: function(state, callback) {
			var opts = this.opts.optBackground ? {name:"WSCListenSocket", persistent:true} : {}
            sockets.tcpServer.create(opts, this.onServerSocket.bind(this,state,callback))
        },
        onServerSocket: function(state,callback,sockInfo) {
            var host = this.get_host()
            this.sockInfo = sockInfo
            var tryPort = this.computePortRetry(state.port_attempts)
            state.port_attempts++
            //console.log('attempting to listen on port',host,tryPort)
            sockets.tcpServer.listen(this.sockInfo.socketId,
                                     host,
                                     tryPort,
                                     function(result) {
                                         var lasterr = chrome.runtime.lastError
                                         if (lasterr || result < 0) {
                                             console.log('lasterr listen on port',tryPort, lasterr, result)
                                             if (this.opts.optTryOtherPorts && state.port_attempts < 5) {
                                                 this.tryListenOnPort(state, callback)
                                             } else {
                                                 var errInfo = {error:"Could not listen", attempts: state.port_attempts, code:result, lasterr:lasterr}
                                                 //this.error(errInfo)
                                                 callback(errInfo)
                                             }
                                         } else {
                                             callback({port:tryPort})
                                         }
                                     }.bind(this)
                                    )
        },
        getInterfaces: function(state, callback) {
            console.clog('WSC','no interfaces yet',state)
            chrome.system.network.getNetworkInterfaces( function(result) {
                console.log('network interfaces',result)
                if (result) {
                    for (var i=0; i<result.length; i++) {
                        if (this.opts.optIPV6 || result[i].prefixLength <= 24) {
                            if (result[i].address.startsWith('fe80::')) { continue }
                            this.interfaces.push(result[i])
                            console.log('found interface address: ' + result[i].address)
                        }
                    }
                }

                // maybe wifi not connected yet?
                if (this.interfaces.length == 0 && this.optRetryInterfaces) {
                    state.interface_retry_count++
                    if (state.interface_retry_count > 5) {
                        callback()
                    } else {
                        setTimeout( function() {
                            this.getInterfaces(state, callback)
                        }.bind(this), 1000 )
                    }
                } else {
                    callback()
                }
            }.bind(this))
        },
        refreshNetworkInterfaces: function(callback) {
            this.stop( 'refreshNetworkInterfaces', function() {
                this.start(callback)
            }.bind(this))
        },
        /*
        refreshNetworkInterfaces: function(callback) {
            // want to call this if we switch networks. maybe better to just stop/start actually...
            this.urls = []
            this.urls.push({url:'http://127.0.0.1:' + this.port})
            this.interfaces = []
            chrome.system.network.getNetworkInterfaces( function(result) {
                console.log('refreshed network interfaces',result)
                if (result) {
                    for (var i=0; i<result.length; i++) {
                        if (result[i].prefixLength < 64) {
                            //this.urls.push({url:'http://'+result[i].address+':' + this.port})
                            this.interfaces.push(result[i])
                            console.log('found interface address: ' + result[i].address)
                        }
                    }
                }
                this.init_urls()
                callback(this.get_info())
            }.bind(this) )
        },*/
        ensureFirewallOpen: function() {
            // on chromeOS, if there are no foreground windows,
            if (this.opts.optAllInterfaces && chrome.app.window.getAll().length == 0) {
                if (chrome.app.window.getAll().length == 0) {
                    if (window.create_hidden) {
                        create_hidden() // only on chrome OS
                    }
                }
            }
        },
        bindAcceptCallbacks: function() {
            sockets.tcpServer.onAcceptError.addListener(this.onAcceptError.bind(this))
            sockets.tcpServer.onAccept.addListener(this.onAccept.bind(this))
        },
        onAcceptError: function(acceptInfo) {
            if (acceptInfo.socketId != this.sockInfo.socketId) { return }
            // need to check against this.socketInfo.socketId
            console.error('accept error',this.sockInfo.socketId,acceptInfo)
            // set unpaused, etc
        },
        onAccept: function(acceptInfo) {
            //console.log('onAccept',acceptInfo,this.sockInfo)
            if (acceptInfo.socketId != this.sockInfo.socketId) { return }
            if (acceptInfo.socketId) {
                var stream = new WSC.IOStream(acceptInfo.clientSocketId)
                this.adopt_stream(acceptInfo, stream)
            }
        },
        adopt_stream: function(acceptInfo, stream) {
            this.clearIdle()
            //var stream = new IOStream(acceptInfo.socketId)
            this.streams[acceptInfo.clientSocketId] = stream
            stream.addCloseCallback(this.onStreamClose.bind(this))
            var connection = new WSC.HTTPConnection(stream)
            connection.addRequestCallback(this.onRequest.bind(this,stream,connection))
            connection.tryRead()
        },
        onRequest: function(stream, connection, request) {
            console.log('Request',request.method, request.uri)

            if (this.opts.auth) {
                var validAuth = false
                var auth = request.headers['authorization']
                if (auth) {
                    if (auth.slice(0,6).toLowerCase() == 'basic ') {
                        var userpass = atob(auth.slice(6,auth.length)).split(':')
                        if (userpass[0] == this.opts.auth.username &&
                            userpass[1] == this.opts.auth.password) {
                            validAuth = true
                        }
                    }
                }

                if (! validAuth) {
                    var handler = new WSC.BaseHandler(request)

                    handler.app = this
                    handler.request = request
                    handler.setHeader("WWW-Authenticate", "Basic")
                    handler.write("", 401)
                    handler.finish()
                    return
                }
            }


            for (var i=0; i<this.handlersMatch.length; i++) {
                var re = this.handlersMatch[i][0]
                var reresult = re.exec(request.uri)
                if (reresult) {
                    var cls = this.handlersMatch[i][1]
                    var requestHandler = new cls(request)
                    requestHandler.connection = connection
                    requestHandler.app = this
                    requestHandler.request = request
                    stream.lastHandler = requestHandler
                    var handlerMethod = requestHandler[request.method.toLowerCase()]
                    var preHandlerMethod = requestHandler['before_' + request.method.toLowerCase()]
                    if (preHandlerMethod) {
                        preHandlerMethod.apply(requestHandler, reresult.slice(1))
                        return
                    }
                    if (handlerMethod) {
                        handlerMethod.apply(requestHandler, reresult.slice(1))
                        return
                    }
                }
            }
            console.error('unhandled request',request)
            // create a default handler...
            var handler = new WSC.BaseHandler(request)
            handler.app = this
            handler.request = request
            handler.write("Unhandled request. Did you select a folder to serve?", 404)
            handler.finish()
            setTimeout(function(){
              chrome.runtime.sendMessage('reload');
            }, 15000);
        }
    }

    function BaseHandler() {
        this.headersWritten = false
        this.responseCode = null
        this.responseHeaders = {}
        this.responseData = []
        this.responseLength = null
    }
    _.extend(BaseHandler.prototype, {
        options: function() {
            if (this.app.optCORS) {
                this.set_status(200)
                this.finish()
            } else {
                this.set_status(403)
                this.finish()
            }
        },
        setCORS: function() {
            this.setHeader('access-control-allow-origin','*')
            this.setHeader('access-control-allow-methods','GET, POST')
            this.setHeader('access-control-max-age','120')
        },
        get_argument: function(key,def) {
            if (this.request.arguments[key] !== undefined) {
                return this.request.arguments[key]
            } else {
                return def
            }
        },
        getHeader: function(k,defaultvalue) {
            return this.request.headers[k] || defaultvalue
        },
        setHeader: function(k,v) {
            this.responseHeaders[k] = v
        },
        set_status: function(code) {
            console.assert(! this.headersWritten)
            this.responseCode = code
        },
        writeHeaders: function(code, callback) {
            if (code === undefined || isNaN(code)) { code = this.responseCode || 200 }
            this.headersWritten = true
            var lines = []
            if (code == 200) {
                lines.push('HTTP/1.1 200 OK')
            } else {
                //console.log(this.request.connection.stream.sockId,'response code',code, this.responseLength)
                lines.push('HTTP/1.1 '+ code + ' ' + WSC.HTTPRESPONSES[code])
            }
            if (this.responseHeaders['transfer-encoding'] === 'chunked') {
                // chunked encoding
            } else {
                if (WSC.VERBOSE) {
                    console.log(this.request.connection.stream.sockId,'response code',code, 'clen',this.responseLength)
                }
                console.assert(typeof this.responseLength == 'number')
                lines.push('content-length: ' + this.responseLength)
            }

            var p = this.request.path.split('.')
            if (p.length > 1 && ! this.isDirectoryListing) {
                var ext = p[p.length-1].toLowerCase()
                var type = WSC.MIMETYPES[ext]
                if (type) {
                    // go ahead and assume utf-8 for text/plain and text/html... (what other types?)
                    // also how do we detect this in general? copy from nginx i guess?
                    /*
Changes with nginx 0.7.9                                         12 Aug 2008
    *) Change: now ngx_http_charset_module works by default with following
       MIME types: text/html, text/css, text/xml, text/plain,
       text/vnd.wap.wml, application/x-javascript, and application/rss+xml.
*/
                    var default_types = ['text/html',
                                         'text/xml',
                                         'text/plain',
                                         "text/vnd.wap.wml",
                                         "application/javascript",
                                         "application/rss+xml"]

                    if (_.contains(default_types, type)) {
                        type += '; charset=utf-8'
                    }
                    this.setHeader('content-type',type)
                }
            }

            if (this.app.opts.optCORS) {
                this.setCORS()
            }

            for (key in this.responseHeaders) {
                lines.push(key +': '+this.responseHeaders[key])
            }
            lines.push('\r\n')
            var headerstr = lines.join('\r\n')
            //console.log('write headers',headerstr)
            this.request.connection.write(headerstr, callback)
        },
        writeChunk: function(data) {
            console.assert( data.byteLength !== undefined )
            var chunkheader = data.byteLength.toString(16) + '\r\n'
            //console.log('write chunk',[chunkheader])
            this.request.connection.write( WSC.str2ab(chunkheader) )
            this.request.connection.write( data )
            this.request.connection.write( WSC.str2ab('\r\n') )
        },
        write: function(data, code, opt_finish) {
            if (typeof data == "string") {
                // using .write directly can be dumb/dangerous. Better to pass explicit array buffers
                //console.warn('putting strings into write is not well tested with multi byte characters')
                data = new TextEncoder('utf-8').encode(data).buffer
            }

            console.assert(data.byteLength !== undefined)
            if (code === undefined) { code = 200 }
            this.responseData.push(data)
            this.responseLength += data.byteLength
            // todo - support chunked response?
            if (! this.headersWritten) {
                this.writeHeaders(code)
            }
            for (var i=0; i<this.responseData.length; i++) {
                this.request.connection.write(this.responseData[i])
            }
            this.responseData = []
            if (opt_finish !== false) {
                this.finish()
            }
        },
        finish: function() {
            if (! this.headersWritten) {
                this.responseLength = 0
                this.writeHeaders()
            }
            if (this.beforefinish) { this.beforefinish() }
            this.request.connection.curRequest = null
            if (this.request.isKeepAlive() && ! this.request.connection.stream.remoteclosed) {
                this.request.connection.tryRead()
                if (WSC.DEBUG) {
                    //console.log('webapp.finish(keepalive)')
                }
            } else {
                this.request.connection.close()
                if (WSC.DEBUG) {
                    //console.log('webapp.finish(close)')
                }
            }
        }
    })

    function FileSystem(entry) {
        this.entry = entry
    }
    _.extend(FileSystem.prototype, {
        getByPath: function(path, callback) {
            if (path == '/') {
                callback(this.entry)
                return
            }
            var parts = path.split('/')
            var newpath = parts.slice(1,parts.length)
            WSC.recursiveGetEntry(this.entry, newpath, callback)
        }
    })

    WSC.FileSystem = FileSystem
    WSC.BaseHandler = BaseHandler
    WSC.WebApplication = WebApplication

})();

// WEBAPP.JS END //

// HANDLERS.JS START //

(function(){
    _DEBUG = false

    function getEntryFile( entry, callback ) {
        // XXX if file is 0 bytes, and then write some data, it stays cached... which is bad...

        var cacheKey = entry.filesystem.name + '/' + entry.fullPath
        var inCache = WSC.entryFileCache.get(cacheKey)
        if (inCache) {
            //console.log('file cache hit');
            callback(inCache); return }

        entry.file( function(file) {
            if (false) {
                WSC.entryFileCache.set(cacheKey, file)
            }
            callback(file)
        }, function(evt) {
            // todo -- actually respond with the file error?
            // or cleanup the context at least
            console.error('entry.file() error',evt)
            debugger
            evt.error = true
            // could be NotFoundError
            callback(evt)
        })
    }

    function ProxyHandler(validator, request) {
        WSC.BaseHandler.prototype.constructor.call(this)
        this.validator = validator
    }
    _.extend(ProxyHandler.prototype, {
        get: function() {
            if (! this.validator(this.request)) {
                this.responseLength = 0
                this.writeHeaders(403)
                this.finish()
                return
            }
            console.log('proxyhandler get',this.request)
            var url = this.request.arguments.url
            var xhr = new WSC.ChromeSocketXMLHttpRequest
            var chromeheaders = {
//                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
//                'Accept-Encoding':'gzip, deflate, sdch',
                'Accept-Language':'en-US,en;q=0.8',
                'Cache-Control':'no-cache',
//                'Connection':'keep-alive',
                'Pragma':'no-cache',
                'Upgrade-Insecure-Requests':'1',
                'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
            }
            for (var k in chromeheaders) {
                xhr.setRequestHeader(k, chromeheaders[k])
            }
            xhr.open("GET", url)
            xhr.onload = this.onfetched.bind(this)
            xhr.send()
        },
        onfetched: function(evt) {
            for (var header in evt.target.headers) {
                this.setHeader(header, evt.target.headers[header])
            }
            this.responseLength = evt.target.response.byteLength
            this.writeHeaders(evt.target.code)
            this.write(evt.target.response)
            this.finish()
        }
    }, WSC.BaseHandler.prototype)
    WSC.ProxyHandler = ProxyHandler

    function DirectoryEntryHandler(fs, request) {
        WSC.BaseHandler.prototype.constructor.call(this)
        this.fs = fs
        //this.debugInterval = setInterval( this.debug.bind(this), 1000)
        this.entry = null
        this.file = null
        this.readChunkSize = 4096 * 16
        this.fileOffset = 0
        this.fileEndOffset = 0
        this.bodyWritten = 0
        this.isDirectoryListing = false
        request.connection.stream.onclose = this.onClose.bind(this)
    }
    _.extend(DirectoryEntryHandler.prototype, {
        onClose: function() {
            //console.log('closed',this.request.path)
            clearInterval(this.debugInterval)
        },
        debug: function() {
            //console.log(this.request.connection.stream.sockId,'debug wb:',this.request.connection.stream.writeBuffer.size())
        },
        head: function() {
            this.get()
        },
        put: function() {
            if (! this.app.opts.optUpload) {
                this.responseLength = 0
                this.writeHeaders(400)
                this.finish()
                return
            }

            // if upload enabled in options...
            // check if file exists...
            this.fs.getByPath(this.request.path, this.onPutEntry.bind(this))
        },
        onPutEntry: function(entry) {
            var parts = this.request.path.split('/')
            var path = parts.slice(0,parts.length-1).join('/')
            var filename = parts[parts.length-1]

            if (entry && entry.error == 'path not found') {
                // good, we can upload it here ...
                this.fs.getByPath(path, this.onPutFolder.bind(this,filename))
            } else {
                var allowReplaceFile = true
                console.log('file already exists', entry)
                if (allowReplaceFile) {
                    this.fs.getByPath(path, this.onPutFolder.bind(this,filename))
                }
            }
        },
        onPutFolder: function(filename, folder) {
            var onwritten = function(evt) {
                console.log('write complete',evt)
                // TODO write 400 in other cases...
                this.responseLength = 0
                this.writeHeaders(200)
                this.finish()
            }.bind(this)
            var body = this.request.body
            function onfile(entry) {
                if (entry && entry.isFile) {
                    function onwriter(writer) {
                        writer.onwrite = writer.onerror = onwritten
                        writer.write(new Blob([body]))
                    }
                    entry.createWriter(onwriter, onwriter)
                }
            }
            folder.getFile(filename, {create:true}, onfile, onfile)
        },
        get: function() {
            //this.request.connection.stream.onWriteBufferEmpty = this.onWriteBufferEmpty.bind(this)

            this.setHeader('accept-ranges','bytes')
            this.setHeader('connection','keep-alive')
            if (! this.fs) {
                this.write("error: need to select a directory to serve",500)
                return
            }
            //var path = decodeURI(this.request.path)

            // strip '/' off end of path

            if (this.fs.isFile) {
                this.onEntry(this.fs)
            } else {
                this.fs.getByPath(this.request.path, this.onEntry.bind(this))
            }
        },
        doReadChunk: function() {
            //console.log(this.request.connection.stream.sockId, 'doReadChunk', this.fileOffset)
            var reader = new FileReader;

            var endByte = Math.min(this.fileOffset + this.readChunkSize,
                                   this.fileEndOffset)
            if (endByte >= this.file.size) {
                console.error('bad readChunk')
                console.assert(false)
            }

            //console.log('doReadChunk',this.fileOffset,endByte-this.fileOffset)
            reader.onload = this.onReadChunk.bind(this)
            reader.onerror = this.onReadChunk.bind(this)
            var blobSlice = this.file.slice(this.fileOffset, endByte + 1)
            var oldOffset = this.fileOffset
            this.fileOffset += (endByte - this.fileOffset) + 1
            //console.log('offset',oldOffset,this.fileOffset)
            reader.readAsArrayBuffer(blobSlice)
        },
        onWriteBufferEmpty: function() {
            if (! this.file) {
                console.error('!this.file')
                debugger
                return
            }
            console.assert( this.bodyWritten <= this.responseLength )
            //console.log('onWriteBufferEmpty', this.bodyWritten, '/', this.responseLength)
            if (this.bodyWritten > this.responseLength) {
                console.assert(false)
            } else if (this.bodyWritten == this.responseLength) {
                this.request.connection.stream.onWriteBufferEmpty = null
                this.finish()
                return
            } else {
                if (this.request.connection.stream.remoteclosed) {
                    this.request.connection.close()
                    // still read?
                } else if (! this.request.connection.stream.closed) {
                    this.doReadChunk()
                }
            }
        },
        onReadChunk: function(evt) {
            //console.log('onReadChunk')
            if (evt.target.result) {
                this.bodyWritten += evt.target.result.byteLength
                if (this.bodyWritten >= this.responseLength) {
                    //this.request.connection.stream.onWriteBufferEmpty = null
                }
                //console.log(this.request.connection.stream.sockId,'write',evt.target.result.byteLength)
                this.request.connection.write(evt.target.result)
            } else {
                console.error('onreadchunk error',evt.target.error)
                this.request.connection.close()
            }
        },
        onEntry: function(entry) {
            this.entry = entry

            if (this.entry && this.entry.isDirectory && ! this.request.origpath.endsWith('/')) {
                var newloc = this.request.origpath + '/'
                this.setHeader('location', newloc) // XXX - encode latin-1 somehow?
                this.responseLength = 0
                //console.log('redirect ->',newloc)
                this.writeHeaders(301)

                this.finish()
                return
            }



            if (this.request.connection.stream.closed) {
                console.warn(this.request.connection.stream.sockId,'request closed while processing request')
                return
            }
            if (! entry) {
                if (this.request.method == "HEAD") {
                    this.responseLength = 0
                    this.writeHeaders(404)
                    this.finish()
                } else {
                    this.write('no entry',404)
                }
            } else if (entry.error) {
                if (this.request.method == "HEAD") {
                    this.responseLength = 0
                    this.writeHeaders(404)
                    this.finish()
                } else {
                    this.write('entry not found',404)
                }
            } else if (entry.isFile) {
                this.renderFileContents(entry)
            } else {
                // directory
                var reader = entry.createReader()
                var allresults = []
                this.isDirectoryListing = true

                function onreaderr(evt) {
                    WSC.entryCache.unset(this.entry.filesystem.name + this.entry.fullPath)
                    console.error('error reading dir',evt)
                    this.request.connection.close()
                }

                function alldone(results) {
                    if (this.app.opts.optRenderIndex) {
                        for (var i=0; i<results.length; i++) {
                            if (results[i].name == 'index.html' || results[i].name == 'index.htm') {
                                this.setHeader('content-type','text/html; charset=utf-8')
                                this.renderFileContents(results[i])
                                return
                            }
                        }
                    }
                    if (this.request.arguments && this.request.arguments.json == '1' ||
                        (this.request.headers['accept'] && this.request.headers['accept'].toLowerCase() == 'applicaiton/json')
                       ) {
                        this.renderDirectoryListingJSON(results)
                    } else if (this.request.arguments && this.request.arguments.static == '1' ||
                        this.request.arguments.static == 'true' ||
						this.app.opts.optStatic
                       ) {
                        this.renderDirectoryListing(results)
                    } else {
                        this.renderDirectoryListingTemplate(results)
                    }
                }

                function onreadsuccess(results) {
                    //console.log('onreadsuccess',results.length)
                    if (results.length == 0) {
                        alldone.bind(this)(allresults)
                    } else {
                        allresults = allresults.concat( results )
                        reader.readEntries( onreadsuccess.bind(this),
                                            onreaderr.bind(this) )
                    }
                }

                //console.log('readentries')
                reader.readEntries( onreadsuccess.bind(this),
                                    onreaderr.bind(this))
            }
        },
        renderFileContents: function(entry, file) {
            getEntryFile(entry, function(file) {
                if (file instanceof DOMException) {
                    this.write("File not found", 404)
                    this.finish()
                    return
                }
                this.file = file
                if (this.request.method == "HEAD") {
                    this.responseLength = this.file.size
                    this.writeHeaders(200)
                    this.finish()

                } else if (this.file.size > this.readChunkSize * 8 ||
                           this.request.headers['range']) {
                    this.request.connection.stream.onWriteBufferEmpty = this.onWriteBufferEmpty.bind(this)

                    if (this.request.headers['range']) {
                        console.log(this.request.connection.stream.sockId,'RANGE',this.request.headers['range'])

                        var range = this.request.headers['range'].split('=')[1].trim()

                        var rparts = range.split('-')
                        if (! rparts[1]) {
                            this.fileOffset = parseInt(rparts[0])
                            this.fileEndOffset = this.file.size - 1
                            this.responseLength = this.file.size - this.fileOffset;
                            this.setHeader('content-range','bytes '+this.fileOffset+'-'+(this.file.size-1)+'/'+this.file.size)
                            if (this.fileOffset == 0) {
                                this.writeHeaders(200)
                            } else {
                                this.writeHeaders(206)
                            }

                        } else {
                            //debugger // TODO -- add support for partial file fetching...
                            //this.writeHeaders(500)
                            this.fileOffset = parseInt(rparts[0])
                            this.fileEndOffset = parseInt(rparts[1])
                            this.responseLength = this.fileEndOffset - this.fileOffset + 1
                            this.setHeader('content-range','bytes '+this.fileOffset+'-'+(this.fileEndOffset)+'/'+this.file.size)
                            this.writeHeaders(206)
                        }


                    } else {
                        if (_DEBUG) {
                            console.log('large file, streaming mode!')
                        }
                        this.fileOffset = 0
                        this.fileEndOffset = this.file.size - 1
                        this.responseLength = this.file.size
                        this.writeHeaders(200)
                    }





                } else {
                    //console.log(entry,file)
                    var fr = new FileReader
                    var cb = this.onReadEntry.bind(this)
                    fr.onload = cb
                    fr.onerror = cb
                    fr.readAsArrayBuffer(file)
                }
            }.bind(this))
        },
        entriesSortFunc: function(a,b) {
            var anl = a.name.toLowerCase()
            var bnl = b.name.toLowerCase()
            if (a.isDirectory && b.isDirectory) {
                return anl.localeCompare(bnl)
            } else if (a.isDirectory) {
                return -1
            } else if (b.isDirectory) {
                return 1
            } else {
                /// both files
                return anl.localeCompare(bnl)
            }

        },
        renderDirectoryListingJSON: function(results) {
            this.setHeader('content-type','application/json; charset=utf-8')
            this.write(JSON.stringify(results.map(function(f) { return { name:f.name,
                                                                         fullPath:f.fullPath,
                                                                         isFile:f.isFile,
                                                                         isDirectory:f.isDirectory }
                                                              }), null, 2))
        },
        renderDirectoryListingTemplate: function(results) {
            if (! WSC.template_data) {
                return this.renderDirectoryListing(results)
            }

            this.setHeader('transfer-encoding','chunked')
            this.writeHeaders(200)
            this.writeChunk(WSC.template_data )
            var html = ['<script>start("current directory...")</script>',
                        '<script>addRow("..","..",1,"170 B","10/2/15, 8:32:45 PM");</script>']

            for (var i=0; i<results.length; i++) {
                var rawname = results[i].name
                var name = encodeURIComponent(results[i].name)
                var isdirectory = results[i].isDirectory
                var filesize = '""'
                //var modified = '10/13/15, 10:38:40 AM'
                var modified = ''
                // raw, urlencoded, isdirectory, size,
                html.push('<script>addRow("'+rawname+'","'+name+'",'+isdirectory+','+filesize+',"'+modified+'");</script>')
            }
            var data = html.join('\n')
            data = new TextEncoder('utf-8').encode(data).buffer
            this.writeChunk(data)
            this.request.connection.write(WSC.str2ab('0\r\n\r\n'))
            this.finish()
        },
        renderDirectoryListing: function(results) {
            var html = ['<html>']
            html.push('<style>li.directory {background:#aab}</style>')
            html.push('<a href="../?static=1">parent</a>')
            html.push('<ul>')
            results.sort( this.entriesSortFunc )

            // TODO -- add sorting (by query parameter?) show file size?

            for (var i=0; i<results.length; i++) {
                var name = _.escape(results[i].name)
                if (results[i].isDirectory) {
                    html.push('<li class="directory"><a href="' + name + '/?static=1">' + name + '</a></li>')
                } else {
                    html.push('<li><a href="' + name + '?static=1">' + name + '</a></li>')
                }
            }
            html.push('</ul></html>')
            this.setHeader('content-type','text/html; charset=utf-8')
            this.write(html.join('\n'))
        },
        onReadEntry: function(evt) {
            if (evt.type == 'error') {
                console.error('error reading',evt.target.error)
                // clear this file from cache...
                WSC.entryFileCache.unset( this.entry.filesystem.name + '/' + this.entry.fullPath )

                this.request.connection.close()
            } else {
            // set mime types etc?
                this.write(evt.target.result)
            }

        }
    }, WSC.BaseHandler.prototype)

    if (chrome.runtime.id == WSC.store_id) {

        chrome.runtime.getPackageDirectoryEntry( function(pentry) {
            var template_filename = 'directory-listing-template.html'
            var onfile = function(e) {
                if (e instanceof DOMException) {
                    console.error('template fetch:',e)
                } else {
                    var onfile = function(file) {
                        var onread = function(evt) {
                            WSC.template_data = evt.target.result
                        }
                        var fr = new FileReader
                        fr.onload = onread
                        fr.onerror = onread
                        fr.readAsArrayBuffer(file)
                    }
                    e.file( onfile, onfile )
                }
            }
            pentry.getFile(template_filename,{create:false},onfile,onfile)
        })
    }


    WSC.DirectoryEntryHandler = DirectoryEntryHandler

})();

// HANDLERS.JS END //

// HTTPLIB.JS START //

(function() {
var HTTPRESPONSES = {
    "200": "OK",
    "201": "Created",
    "202": "Accepted",
    "203": "Non-Authoritative Information",
    "204": "No Content",
    "205": "Reset Content",
    "206": "Partial Content",
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "407": "Proxy Authentication Required",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Request Entity Too Large",
    "414": "Request-URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Requested Range Not Satisfiable",
    "417": "Expectation Failed",
    "100": "Continue",
    "101": "Switching Protocols",
    "300": "Multiple Choices",
    "301": "Moved Permanently",
    "302": "Found",
    "303": "See Other",
    "304": "Not Modified",
    "305": "Use Proxy",
    "306": "(Unused)",
    "307": "Temporary Redirect",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported"
}
WSC.HTTPRESPONSES = HTTPRESPONSES
})();

// HTTPLIB.JS END //
