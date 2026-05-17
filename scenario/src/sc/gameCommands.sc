theme: /

    state: SelectOptionByDigit
        q!: (один|два|три|четыре)
        script:
            var option = $parseTree.text;
            var optionMap = {
                "один": "1",
                "два": "2",
                "три": "3",
                "четыре": "4"
            };
            submitAnswer(optionMap[option], $context);
        a: Принято.

    state: SelectOptionByNumber
        q!: (1|2|3|4)
        script:
            submitAnswer($parseTree.text, $context);
        a: Принято.