exports.get404 = (req, res, next) => {
    res.status(404).render('404', {
        layout: true,
        pageTitle: '404',
        path: req.url,
    });
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        layout: true,
        pageTitle: '500',
        path: req.url,
    });
};
