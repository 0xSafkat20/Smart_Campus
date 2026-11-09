namespace SchoolAdmission.Api.Features.Holds;

public static class StudentIdentity
{
    public const string HeaderName = "X-Student-Id";

    public static bool TryRead(HttpRequest request, out string studentId)
    {
        studentId = string.Empty;

        if (!request.Headers.TryGetValue(HeaderName, out var values)
            || values.Count != 1)
        {
            return false;
        }

        var value = values[0];
        if (value is null
            || value.Length != 17
            || !value.All(char.IsAsciiDigit))
        {
            return false;
        }

        studentId = value;
        return true;
    }
}
