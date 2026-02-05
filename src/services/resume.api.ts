import { supabase } from '../pages/supabaseClient';

/**
 * Generate resume from external API
 * @param userId - The user ID to generate resume for
 * @returns Promise<Blob> - The resume PDF blob
 */
export const generateResume = async (userId: string): Promise<Blob> => {
    const endpoint = `https://p5f7dahljj.execute-api.ap-south-1.amazonaws.com/resume/generate/${userId}`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/pdf',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to generate resume: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
};

/**
 * Upload resume to Supabase storage
 * @param userId - The user ID
 * @param resumeBlob - The resume PDF blob
 * @returns Promise<string> - The public URL of the uploaded file
 */
export const uploadResumeToSupabase = async (userId: string, resumeBlob: Blob): Promise<string> => {
    const fileName = `resume_${userId}_${Date.now()}.pdf`;
    const filePath = `resumes/${fileName}`;

    // Upload file to Supabase storage
    const { data, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeBlob, {
            contentType: 'application/pdf',
            upsert: true,
        });

    if (uploadError) {
        throw new Error(`Failed to upload resume to storage: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

    // Save resume metadata to database with error handling
    try {
        // Try to insert first
        const { data: insertData, error: insertError } = await supabase
            .from('resumes')
            .insert({
                user_id: userId,
                file_url: publicUrl,
                file_size: resumeBlob.size,
            });

        // If duplicate, update instead
        if (insertError?.code === 'PGRST116' || insertError?.message?.includes('duplicate')) {
            const { error: updateError } = await supabase
                .from('resumes')
                .update({
                    file_url: publicUrl,
                    file_size: resumeBlob.size,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (updateError) {
                throw new Error(`Failed to update resume metadata: ${updateError.message}`);
            }
        } else if (insertError) {
            throw new Error(`Failed to save resume metadata: ${insertError.message}`);
        }
    } catch (error) {
        console.error('Database error:', error);
        // Continue anyway - file is uploaded, just metadata failed
        console.warn('Warning: Resume uploaded but metadata save failed. File is still accessible at:', publicUrl);
    }

    return publicUrl;
};

/**
 * Generate and upload resume
 * @param userId - The user ID
 * @returns Promise<string> - The public URL of the resume
 */
export const generateAndUploadResume = async (userId: string): Promise<string> => {
    try {
        // Step 1: Generate resume from API
        const resumeBlob = await generateResume(userId);

        // Step 2: Upload to Supabase
        const publicUrl = await uploadResumeToSupabase(userId, resumeBlob);

        return publicUrl;
    } catch (error) {
        throw error;
    }
};

/**
 * Get resume URL from Supabase database
 * @param userId - The user ID
 * @returns Promise<string | null> - The resume URL or null if not found
 */
export const getResumeUrl = async (userId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('resumes')
            .select('file_url')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return null;
        }

        return data.file_url;
    } catch (error) {
        console.error('Error fetching resume URL:', error);
        return null;
    }
};
