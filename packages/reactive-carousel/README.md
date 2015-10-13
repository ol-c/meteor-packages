# meteor-reactive-carousel
Fully reactive carousel that renders only the previous, current and next item of a cursor or a list of ids.
It is intended to be used as a carousel that fills the entire page. Pinch to zoom is also implemented.

Usage:

{{> reactiveCarousel cursor=cursor [startIndex=INT(default=0)] }}

or

{{> reactiveCarousel list=listOfIds collection=Collection [startIndex=INT(default=0)]}}