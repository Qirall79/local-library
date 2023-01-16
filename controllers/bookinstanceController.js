const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = (req, res) => {
  BookInstance.find()
    .populate("book")
    .exec((err, list) => {
      if (err) {
        return next(err);
      }
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res) => {
  const id = req.params.id;
  BookInstance.findById(id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, list) => {
    if (err) {
      return next(err);
    }
    res.render("bookinstance_form", {
      title: "Create Book Instance",
      book_list: list,
      options: ["Available", "Maintenance", "Loaned", "Reserved"],
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty) {
      Book.find({}, "title").exec((err, list) => {
        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Create Book Instance",
          book_list: list,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          options: ["Available", "Maintenance", "Loaned", "Reserved"],
          selected_option: bookinstance.status,
          bookinstance,
        });
      });
      return;
    }
    bookinstance.save((err) => {
      if (err) {
        next(err);
      }
      res.redirect(bookinstance.url);
    });
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id).exec((err, instance) => {
    if (err) {
      return next(err);
    }
    if (instance == null) {
      res.redirect("/catalog/bookinstances");
    }
    res.render("bookinstance_delete", {
      title: "Delete book instance",
      bookinstance: instance,
    });
  });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res) => {
  BookInstance.findByIdAndRemove(req.body.instanceid, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/catalog/bookinstances");
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      books(callback) {
        Book.find({}, "title").exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        res.redirect("/catalog/bookinstances");
      }
      res.render("bookinstance_form", {
        title: "Update Book Instance",
        bookinstance: results.bookinstance,
        selected_book: results.bookinstance.book._id,
        book_list: results.books,
        options: ["Available", "Maintenance", "Loaned", "Reserved"],
        selected_option: results.bookinstance.status,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);
    const newInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Update Book Instance",
          book_list: books,
          selected_book: newInstance.book._id,
          bookinstance: newInstance,
          options: ["Available", "Maintenance", "Loaned", "Reserved"],
          selected_status: newInstance.status,
          errors: errors.array(),
        });
      });
    }
    BookInstance.findByIdAndUpdate(req.params.id, newInstance, {}, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect(newInstance.url);
    });
  },
];
