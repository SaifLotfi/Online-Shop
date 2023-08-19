const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
    fetch(`/admin/delete-product/${productId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrfToken,
        },
    })
        .then((result) => {
            return result.json();
        }).then(result=>{
            console.log(result);
            // if(result.status!==200){

            // }
            btn.closest('article').remove();
        })
        .catch((err) => console.log(err));
};
