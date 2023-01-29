function Conditional(jsonObj)
{
    this.outputID = '$_' + (jsonObj['i'] || jsonObj['ID']);
    this.condition = jsonObj['c'] || jsonObj['cond'];
    dataConds[this.outputID] = 0;
}

Conditional.prototype.update = function()
{
    var b = dataConds[this.outputID];
    dataConds[this.outputID] = logic(this.condition) ? 1 : 0;

    if (b != dataConds[this.outputID])
        fillBerths();
}

function logic(c)
{
    if (!Array.isArray(c))
        throw c.toString() + " is not a conditional array";

    if (c[0] == "AND" || c[0] == ".")
    {
        for (var i = 1; i < c.length; i++)
        {
            if (Array.isArray(c[i]))
            {
                if (!logic(c[i]))
                    return false;
            }
            else if (getData(c[i]) == "0" || getData(c[i]) == 0 || getData(c[i]) == "")
                return false;
        }

        return true;
    }
    else if (c[0] == "OR" || c[0] == "+")
    {
        for (var i = 1; i < c.length; i++)
        {
            if (Array.isArray(c[i]))
            {
                if (logic(c[i]))
                    return true;
            }
            else if (getData(c[i]) == "1" || getData(c[i]) == 1 || getData(c[i]) != "")
                return true;
        }

        return false;
    }
    else if (c[0] == "NOT" || c[0] == "!")
    {
        if (c.length != 2)
            throw "NOT takes 1 operand, " + (c.length-1) + " proveded";

        if (Array.isArray(c[1]))
            return !logic(c[1]);
        else
            return getData(c[1]) == "0" || getData(c[1]) == 0 || getData(c[1]) == "";
    }
    else if (c[0] == "EQL" || c[0] == "==")
    {
        var a = "";
        if (c[1][0] == "'")
            a = c[1].substring(1, c[1].length-1);
        else
            a = getData(c[1])
        var b = "";
        if (c[2][0] == "'")
            b = c[2].substring(1, c[2].length-1);
        else
            b = getData(c[2])

        return a == b;
    }
    else if (c[0] == "NEQ" || c[0] == "!=")
    {
        var a = "";
        if (c[1][0] == "'")
            a = c[1].substring(1, c[1].length-1);
        else
            a = getData(c[1])
        var b = "";
        if (c[2][0] == "'")
            b = c[2].substring(1, c[2].length-1);
        else
            b = getData(c[2])

        return a != b;
    }
    else if (c.length == 1)
        return getData(c[0]) == "1" || getData(c[0]) == 1 || getData(c[0]) != "";
    else
        throw c[0] + " is not an operator"
}