$(function () {
    var spans = $('.score');
    var scores = JSON.parse(localStorage.getItem('highscores')) || [];

    for (var i = 0; i < spans.length; i += 1)
        if (scores[i])
            spans[i].innerText = String(scores[i]);
        else
            $(spans[i]).css('display', 'none');
});
